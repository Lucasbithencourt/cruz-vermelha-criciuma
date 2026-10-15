/**
 * Cruz Vermelha Criciúma · planilha de doadores
 *
 * Recebe cada contato novo do site (via gatilho do Supabase) e grava uma linha na aba "Doadores",
 * com link de WhatsApp pronto e coluna de status para a equipe acompanhar.
 * A aba "Painel" resume tudo em números e gráficos, que se atualizam sozinhos.
 * Instalação: planilha/LEIA-ME.md
 */

var ABA = 'Doadores';
var CABECALHO = ['Data', 'Nome', 'Telefone', 'WhatsApp', 'Status', 'Origem', 'ID'];
var STATUS = ['Novo', 'Contatado', 'Doou', 'Sem retorno'];
var PAINEL = 'Painel';
var DADOS = '_dados_painel'; // aba oculta com as contas dos gráficos

// Cores do site
var VERMELHO = '#B20E17';
var VERMELHO_VIVO = '#E1141E';
var TINTA = '#18181B';
var GRAFITE = '#4D4D55';
var PAPEL = '#FAF8F5';
var LINHA = '#E4E0DA';
var CORES_STATUS = ['#B20E17', '#E8A93B', '#0B7A3B', '#9A9A9A']; // Novo, Contatado, Doou, Sem retorno

/**
 * Fórmulas são escritas com vírgula; em planilhas em português o separador é ponto e vírgula.
 * Nenhuma fórmula deste script tem vírgula dentro de texto entre aspas, então a troca é segura.
 */
function f_(formula) {
  var locale = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetLocale() || 'en_US';
  return /^en/.test(locale) ? formula : formula.replace(/,/g, ';');
}

/** Menu "Cruz Vermelha" na planilha. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Cruz Vermelha')
    .addItem('Configurar planilha', 'configurar')
    .addItem('Refazer o painel', 'montarPainel')
    .addItem('Adicionar linha de teste', 'linhaDeTeste')
    .addToUi();
}

/** Cria e formata a aba (pode rodar mais de uma vez sem estragar nada). */
function configurar() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(ABA) || ss.insertSheet(ABA, 0);

  sh.getRange(1, 1, 1, CABECALHO.length).setValues([CABECALHO])
    .setFontWeight('bold').setFontColor('#FFFFFF').setBackground('#B20E17')
    .setVerticalAlignment('middle');
  sh.setRowHeight(1, 34);
  sh.setFrozenRows(1);

  var larguras = [140, 220, 140, 130, 120, 140, 70];
  larguras.forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });

  var linhas = sh.getMaxRows() - 1;
  sh.getRange(2, 1, linhas, 1).setNumberFormat('dd/MM/yyyy HH:mm');
  sh.getRange(2, 5, linhas, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(STATUS, true).setAllowInvalid(false).build()
  );

  // Cores por status
  var col = sh.getRange(2, 5, linhas, 1);
  var cores = { 'Novo': ['#FCE8E9', '#8E0B12'], 'Contatado': ['#FFF4D6', '#7A5A00'], 'Doou': ['#E3F6EA', '#0B7A3B'], 'Sem retorno': ['#EEEEEE', '#555555'] };
  var regras = Object.keys(cores).map(function (s) {
    return SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(s)
      .setBackground(cores[s][0]).setFontColor(cores[s][1]).setRanges([col]).build();
  });
  sh.setConditionalFormatRules(regras);

  // Linhas zebradas para facilitar a leitura
  sh.getBandings().forEach(function (b) { b.remove(); });
  sh.getRange(2, 1, linhas, CABECALHO.length)
    .applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false)
    .setFirstRowColor('#FFFFFF').setSecondRowColor(PAPEL);
  sh.setTabColor(VERMELHO);

  if (!sh.getFilter()) sh.getRange(1, 1, sh.getMaxRows(), CABECALHO.length).createFilter();

  montarPainel();

  // Remove a "Página1" vazia, se existir
  var vazia = ss.getSheetByName('Página1') || ss.getSheetByName('Sheet1');
  if (vazia && vazia.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(vazia);

  // O aviso só aparece quando roda pelo menu da planilha; pelo botão Executar do Apps Script ele é pulado
  try {
    SpreadsheetApp.getUi().alert('Planilha e painel configurados. Agora publique como app da Web (passo 4 do LEIA-ME).');
  } catch (e) {
    console.log('Planilha e painel configurados.');
  }
}

/* Painel -------------------------------------------------------------------- */

/** Monta (ou refaz) a aba "Painel": números principais, 4 gráficos e últimos contatos. */
function montarPainel() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dados = prepararDados_(ss);

  var p = ss.getSheetByName(PAINEL);
  if (p) {
    p.getCharts().forEach(function (c) { p.removeChart(c); });
    p.clear();
    p.getRange(1, 1, p.getMaxRows(), p.getMaxColumns()).breakApart();
  } else {
    p = ss.insertSheet(PAINEL, 0);
  }
  p.setHiddenGridlines(true);
  p.setTabColor(TINTA);
  p.getRange(1, 1, p.getMaxRows(), p.getMaxColumns()).setBackground(PAPEL).setFontFamily('Archivo').setFontColor(TINTA);
  p.setColumnWidth(1, 24);
  for (var c = 2; c <= 13; c++) p.setColumnWidth(c, 92);
  p.setColumnWidth(14, 24);

  // Título
  p.getRange('B2').setValue('Cruz Vermelha Criciúma · Painel de doadores').setFontSize(22).setFontWeight('bold');
  p.getRange('B3').setValue('Atualiza sozinho a cada contato deixado no site. Para mudar o status de alguém, use a aba Doadores.')
    .setFontColor(GRAFITE).setFontSize(10);
  p.setRowHeight(2, 40);

  // Cartões com os números principais
  var cartoes = [
    ['CONTATOS RECEBIDOS', '=COUNTA(Doadores!B2:B)', '0', 'desde o lançamento do site'],
    ['ÚLTIMOS 7 DIAS', '=COUNTIFS(Doadores!A2:A,">="&(TODAY()-6))', '0', 'contando hoje'],
    ['JÁ CONTATADOS', '=IFERROR((COUNTIF(Doadores!E2:E,"Contatado")+COUNTIF(Doadores!E2:E,"Doou"))/COUNTA(Doadores!B2:B),0)', '0%', 'status Contatado ou Doou'],
    ['DOARAM', '=COUNTIF(Doadores!E2:E,"Doou")', '0', 'status Doou']
  ];
  cartoes.forEach(function (cfg, i) {
    var col = 2 + i * 3;
    var bloco = p.getRange(5, col, 3, 3);
    bloco.setBackground('#FFFFFF').setBorder(true, true, true, true, false, false, LINHA, SpreadsheetApp.BorderStyle.SOLID);
    p.getRange(5, col, 1, 3).merge().setValue(cfg[0]).setFontSize(9).setFontWeight('bold').setFontColor(GRAFITE).setVerticalAlignment('bottom');
    p.getRange(6, col, 1, 3).merge().setFormula(f_(cfg[1])).setNumberFormat(cfg[2]).setFontSize(30).setFontWeight('bold')
      .setFontColor(i === 3 ? '#0B7A3B' : VERMELHO).setVerticalAlignment('middle');
    p.getRange(7, col, 1, 3).merge().setValue(cfg[3]).setFontSize(9).setFontColor(GRAFITE).setVerticalAlignment('top');
    // Faixa vermelha no topo de cada cartão
    p.getRange(5, col, 1, 3).setBorder(true, null, null, null, null, null, i === 3 ? '#0B7A3B' : VERMELHO, SpreadsheetApp.BorderStyle.SOLID_THICK);
  });
  p.setRowHeight(5, 26);
  p.setRowHeight(6, 52);
  p.setRowHeight(7, 24);
  p.getRange('B5:M7').setHorizontalAlignment('left');

  // Gráficos
  var base = function (tipo, faixa, linha, coluna, largura, titulo) {
    return p.newChart().setChartType(tipo).addRange(faixa).setNumHeaders(1)
      .setPosition(linha, coluna, 0, 0)
      .setOption('title', titulo)
      .setOption('titleTextStyle', { color: TINTA, fontSize: 14, bold: true })
      .setOption('width', largura).setOption('height', 300)
      .setOption('backgroundColor', '#FFFFFF')
      .setOption('fontName', 'Archivo')
      .setOption('legend', { position: 'none' })
      .setOption('vAxis', { minValue: 0, format: '0', gridlines: { color: '#EEEAE4' }, textStyle: { color: GRAFITE } })
      .setOption('hAxis', { textStyle: { color: GRAFITE } });
  };

  p.insertChart(base(Charts.ChartType.COLUMN, dados.getRange('A1:B31'), 9, 2, 640, 'Contatos por dia · últimos 30 dias')
    .setOption('colors', [VERMELHO]).setOption('hAxis', { format: 'dd/MM', textStyle: { color: GRAFITE } }).build());

  p.insertChart(base(Charts.ChartType.PIE, dados.getRange('D1:E5'), 9, 9, 450, 'Status dos contatos')
    .setOption('pieHole', 0.55).setOption('colors', CORES_STATUS)
    .setOption('legend', { position: 'right', textStyle: { color: TINTA } })
    .setOption('pieSliceText', 'value').build());

  p.insertChart(base(Charts.ChartType.COLUMN, dados.getRange('G1:H13'), 26, 2, 640, 'Contatos por mês')
    .setOption('colors', [TINTA]).setOption('hAxis', { format: 'MMM/yy', textStyle: { color: GRAFITE } }).build());

  p.insertChart(base(Charts.ChartType.BAR, dados.getRange('J1:K8'), 26, 9, 450, 'Dias da semana com mais contatos')
    .setOption('colors', [VERMELHO_VIVO]).setOption('hAxis', { minValue: 0, format: '0', textStyle: { color: GRAFITE } }).build());

  // Últimos contatos
  p.getRange('B43').setValue('Últimos contatos').setFontSize(14).setFontWeight('bold');
  p.getRange('B44:H44').setValues([['Data', '', 'Nome', '', '', 'Telefone', 'Status']])
    .setFontSize(9).setFontWeight('bold').setFontColor(GRAFITE)
    .setBorder(null, null, true, null, null, null, LINHA, SpreadsheetApp.BorderStyle.SOLID);
  // Sem mesclar células: a fórmula da data preenche B45:B52 de uma vez e o texto transborda para as colunas vazias ao lado
  // Os 8 contatos mais recentes, montados por fórmula (sempre atualizados)
  p.getRange('B45').setFormula(f_('=IFERROR(INDEX(SORTN(FILTER(Doadores!A2:A,Doadores!A2:A<>""),8,0,1,FALSE)),"Nenhum contato ainda")'));
  for (var i = 0; i < 8; i++) {
    var row = 45 + i;
    var data = 'B' + row;
    p.getRange('D' + row).setFormula(f_('=IF(' + data + '="","",IFERROR(INDEX(Doadores!B2:B,MATCH(' + data + ',Doadores!A2:A,0)),""))'));
    p.getRange('G' + row).setFormula(f_('=IF(' + data + '="","",IFERROR(INDEX(Doadores!C2:C,MATCH(' + data + ',Doadores!A2:A,0)),""))'));
    p.getRange('H' + row).setFormula(f_('=IF(' + data + '="","",IFERROR(INDEX(Doadores!E2:E,MATCH(' + data + ',Doadores!A2:A,0)),""))'));
  }
  p.getRange('B45:B52').setNumberFormat('dd/MM/yyyy HH:mm');
  p.getRange('B45:H52').setFontSize(10).setBorder(null, null, true, null, null, true, '#EEEAE4', SpreadsheetApp.BorderStyle.SOLID);
  p.getRange('B45:H52').setVerticalAlignment('middle');
  for (var rr = 45; rr <= 52; rr++) p.setRowHeight(rr, 26);

  ss.setActiveSheet(p);
  p.setActiveSelection('A1');
}

/** Aba oculta com as contas que alimentam os gráficos (fórmulas, então se atualiza sozinha). */
function prepararDados_(ss) {
  var d = ss.getSheetByName(DADOS) || ss.insertSheet(DADOS);
  d.clear();
  var A = 'Doadores!$A$2:$A';

  // Por dia (últimos 30 dias)
  d.getRange('A1:B1').setValues([['Dia', 'Contatos']]);
  for (var i = 0; i < 30; i++) {
    var r = i + 2;
    d.getRange('A' + r).setFormula(f_('=TODAY()-' + (29 - i)));
    d.getRange('B' + r).setFormula(f_('=COUNTIFS(' + A + ',">="&A' + r + ',' + A + ',"<"&(A' + r + '+1))'));
  }
  d.getRange('A2:A31').setNumberFormat('dd/MM');

  // Por status
  d.getRange('D1:E1').setValues([['Status', 'Contatos']]);
  STATUS.forEach(function (s, i) {
    d.getRange('D' + (i + 2)).setValue(s);
    d.getRange('E' + (i + 2)).setFormula(f_('=COUNTIF(Doadores!$E$2:$E,D' + (i + 2) + ')'));
  });

  // Por mês (últimos 12 meses)
  d.getRange('G1:H1').setValues([['Mês', 'Contatos']]);
  for (var m = 0; m < 12; m++) {
    var rm = m + 2;
    d.getRange('G' + rm).setFormula(f_('=EDATE(DATE(YEAR(TODAY()),MONTH(TODAY()),1),-' + (11 - m) + ')'));
    d.getRange('H' + rm).setFormula(f_('=COUNTIFS(' + A + ',">="&G' + rm + ',' + A + ',"<"&EDATE(G' + rm + ',1))'));
  }
  d.getRange('G2:G13').setNumberFormat('MMM/yy');

  // Por dia da semana
  var dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  d.getRange('J1:K1').setValues([['Dia da semana', 'Contatos']]);
  dias.forEach(function (nome, i) {
    d.getRange('J' + (i + 2)).setValue(nome);
    d.getRange('K' + (i + 2)).setFormula(f_('=SUMPRODUCT((' + A + '<>"")*(WEEKDAY(' + A + ')=' + (i + 1) + '))'));
  });

  d.hideSheet();
  return d;
}

/** Chamado pelo Supabase a cada contato novo. */
function doPost(e) {
  try {
    var dados = JSON.parse(e.postData.contents);
    var r = dados && dados.record;
    if (!r || !r.id || !r.nome || !r.telefone) return resposta_('ignorado');

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      gravar_(r);
    } finally {
      lock.releaseLock();
    }
    return resposta_('ok');
  } catch (err) {
    console.error(err);
    return resposta_('erro');
  }
}

function gravar_(r) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA);
  if (!sh) throw new Error('Rode "Cruz Vermelha > Configurar planilha" primeiro.');

  // Não duplica se o mesmo contato chegar duas vezes
  var jaExiste = sh.getRange(2, 7, Math.max(sh.getLastRow() - 1, 1), 1)
    .createTextFinder(String(r.id)).matchEntireCell(true).findNext();
  if (jaExiste) return;

  var nome = texto_(r.nome, 120);
  var telefone = texto_(r.telefone, 20);
  var data = r.criado_em ? new Date(r.criado_em) : new Date();

  sh.appendRow([data, nome, telefone, '', 'Novo', texto_(r.origem, 200), String(r.id)]);

  // Link clicável para o WhatsApp, com mensagem de agradecimento pronta
  var linha = sh.getLastRow();
  var numero = telefone.replace(/\D/g, '');
  var primeiro = nome.replace(/^'/, '').split(/\s+/)[0];
  var msg = 'Olá, ' + primeiro + '! Aqui é da Cruz Vermelha Criciúma. Obrigado por querer doar! ' +
            'Recebemos doações na sede (Rua Antônio Benedet de Angelo, 15, Pinheirinho) às quintas, das 13h às 17h. Posso te ajudar com alguma dúvida?';
  var link = SpreadsheetApp.newRichTextValue().setText('Abrir conversa')
    .setLinkUrl('https://wa.me/55' + numero + '?text=' + encodeURIComponent(msg)).build();
  sh.getRange(linha, 4).setRichTextValue(link);
}

/** Linha falsa para conferir a formatação (pode apagar depois). */
function linhaDeTeste() {
  gravar_({ id: 'teste-' + Date.now(), nome: 'TESTE (pode apagar)', telefone: '(48) 90000-0000', origem: '/teste', criado_em: new Date().toISOString() });
}

// Limita o tamanho e impede que o texto vire fórmula na planilha (=, +, -, @)
function texto_(v, max) {
  var s = String(v || '').trim().slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function resposta_(t) {
  return ContentService.createTextOutput(t);
}
