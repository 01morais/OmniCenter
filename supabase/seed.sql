insert into setores values ('limpeza','Limpeza'),('manutencao','Manutenção'),('seguranca','Segurança'),('sac','SAC'),('brigada','Brigada'),('triagem','Triagem manual');
insert into categorias values
 ('limpeza','Limpeza','limpeza','Normal'),('manutencao','Manutenção','manutencao','Normal'),
 ('seguranca','Segurança','seguranca','Alta'),('objeto_perdido','Objeto perdido','sac','Normal'),('outro','Outro','triagem','Normal');
-- Coordenadas ilustrativas (0-320 x 0-220): substitua pela planta real do Capim Dourado Shopping no painel de cadastros
insert into locais (id,nome,nivel,tipo,x,y,publico) values
 ('ent','Entrada principal','terreo','acesso',40,160,true),
 ('cen','Corredor central','terreo','corredor',110,160,true),
 ('ria','Riachuelo','terreo','ancora',110,115,true),
 ('cea','C&A','terreo','ancora',190,115,true),
 ('evt','Praça de eventos','terreo','evento',190,160,true),
 ('ren','Renner','terreo','ancora',260,160,true),
 ('esc','Escada rolante','terreo','escada',230,100,true),
 ('elv','Elevador','terreo','elevador',285,100,true),
 ('pra','Praça de alimentação','praca_alimentacao','alimentacao',255,35,true),
 ('ban','Banheiro da praça','praca_alimentacao','banheiro',195,35,true),
 ('sac','SAC','terreo','servico',110,200,true),
 ('est','Estacionamento','subsolo1','estacionamento',40,200,true),
 ('dep','Depósito (área de serviço)','terreo','servico',150,200,false);
insert into ligacoes values
 ('ent','cen',true),('cen','ria',true),('cen','evt',true),('evt','cea',true),('evt','ren',true),
 ('evt','esc',false),('ren','elv',true),('esc','pra',false),('elv','pra',true),('pra','ban',true),
 ('cen','sac',true),('ent','est',true),('sac','dep',true);
insert into pontos_qr values ('QR-001','ent',true),('QR-012','pra',true),('QR-020','evt',true),('QR-030','est',true);
