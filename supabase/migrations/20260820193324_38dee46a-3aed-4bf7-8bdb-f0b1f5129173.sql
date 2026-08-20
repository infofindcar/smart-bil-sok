alter role authenticator reset statement_timeout;
alter role authenticator reset lock_timeout;
alter role anon set statement_timeout = '15s';
alter role authenticated set statement_timeout = '15s';
notify pgrst, 'reload schema';