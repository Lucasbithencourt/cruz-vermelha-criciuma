// Configuração do site. Os contatos do formulário "Quero doar" vão para o Supabase.
// Passo a passo em supabase/LEIA-ME.md
window.CV_CONFIG = {
  supabaseUrl: 'https://cbitixnnwwhrghtwlnnt.supabase.co',
  // Chave PÚBLICA (publishable "sb_publishable_..." ou anon "eyJ..."). Nunca a service_role/secret.
  // Se ficar vazia, o formulário segue para os pontos de coleta sem salvar o contato.
  supabaseKey: 'sb_publishable_ZGDOdDWjfKDC0K6bc9dWVQ_FLWBWgAB',
  supabaseTable: 'doadores'
};
