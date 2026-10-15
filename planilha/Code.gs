/**
 * Cruz Vermelha Criciúma · planilha de doadores
 *
 * Recebe cada contato novo do site (via gatilho do Supabase) e grava uma linha na aba "Doadores",
 * com link de WhatsApp pronto e coluna de status para a equipe acompanhar.
 * Instalação: planilha/LEIA-ME.md
 */

var ABA = 'Doadores';
var CABECALHO = ['Data', 'Nome', 'Telefone', 'WhatsApp', 'Status', 'Origem', 'ID'];
var STATUS = ['Novo', 'Contatado', 'Doou', 'Sem retorno'];

/** Menu "Cruz Vermelha" na planilha. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Cruz Vermelha')
    .addItem('Configurar planilha', 'configurar')
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

  if (!sh.getFilter()) sh.getRange(1, 1, sh.getMaxRows(), CABECALHO.length).createFilter();

  // Remove a "Página1" vazia, se existir
  var vazia = ss.getSheetByName('Página1') || ss.getSheetByName('Sheet1');
  if (vazia && vazia.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(vazia);

  SpreadsheetApp.getUi().alert('Planilha configurada. Agora publique como app da Web (passo 4 do LEIA-ME).');
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
