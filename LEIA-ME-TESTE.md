# OmniCenter · Teste da equipe

## Rodar com o banco já configurado

1. Extraia o ZIP. Abra o terminal na pasta extraída `omnicenter`.
2. Com Node.js 22 ou superior, rode:

   ```sh
   npm ci
   npm run dev
   ```

3. Abra http://localhost:3000. Se o terminal indicar outra porta, abra o endereço que ele mostrar.
4. Na página inicial, escolha um dos 8 QR codes. Você pode começar com o QR-001 (Entrada Principal) ou com o QR-012 (Praça de Alimentação).

O `.env.local` incluído aponta para o banco Supabase de teste já usado pela equipe. Os integrantes verão a mesma planta e os registros feitos no banco compartilhado. Trate o ZIP como privado, pois ele contém a chave do servidor.

## Painel da equipe

Abra `/painel` e entre com seu usuário do Supabase Auth. Se ainda precisar de um login, quem administra o projeto deve criar um usuário em **Authentication → Users** e vincular o perfil pelo SQL Editor. Exemplo para um gestor, usando o e-mail já cadastrado:

```sql
insert into public.perfis (id, email, papel, setor_id)
select id, email, 'gestor', null
from auth.users
where email = 'email-do-integrante@exemplo.com';
```

Para liberar a edição de cadastros, o responsável pelo projeto pode usar o papel `admin` no lugar de `gestor`. O teste de visitante funciona sem login.

## Recriar os dados iniciais em um projeto Supabase próprio

Em um **projeto novo**, execute pelo SQL Editor, na ordem:

1. `supabase/migrations/001_schema.sql`
2. `supabase/seed.sql`
3. `supabase/planta_capim_dourado.sql`

Depois, copie `.env.example` para `.env.local` e preencha a URL, a chave pública, a chave secreta e um valor aleatório para `PIN_SALT`. Os scripts reproduzem os dados iniciais, com 57 locais, 59 ligações e 8 QR codes. O histórico do ambiente compartilhado fica no Supabase.

A IA e o serviço Python são opcionais para testar como visitante. Consulte o README para rodar a inteligência de dados. Para usar o login `analytics_ro` num projeto novo, defina uma senha própria no SQL Editor com `alter role analytics_ro with login password 'SUA_SENHA';`.
