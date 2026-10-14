// Pontos de coleta. Para incluir um ponto, copie um bloco e ajuste os campos; a página se monta sozinha.
// lat/lng: no Google Maps, clique com o botão direito no local e copie as coordenadas.
window.CV_PONTOS = [
  {
    nome: 'Sede da Cruz Vermelha Criciúma',
    principal: true,
    endereco: 'Rua Antônio Benedet de Angelo, 15',
    bairro: 'Pinheirinho',
    cidade: 'Criciúma/SC',
    horario: 'Quintas-feiras, das 13h às 17h (exceto feriados)',
    itens: ['Alimentos', 'Fraldas geriátricas', 'Higiene e limpeza', 'Agasalhos', 'Insumos para fraldas'],
    // Ponto aproximado da rua (OpenStreetMap). Confirmar o pino exato no número 15.
    lat: -28.696419,
    lng: -49.398611
  }
  // Exemplo de ponto parceiro (descomente e preencha):
  // ,{
  //   nome: 'Padaria Exemplo',
  //   endereco: 'Rua Exemplo, 100',
  //   bairro: 'Centro',
  //   cidade: 'Criciúma/SC',
  //   horario: 'Segunda a sábado, das 8h às 19h',
  //   itens: ['Alimentos'],
  //   lat: -28.6775,
  //   lng: -49.3697
  // }
];
