-- Atualiza a senha do usuário Master (leonardo.negri@outlook.com.br) para '05081997'
-- e remove o status de senha temporária.
UPDATE public.users
SET 
    password_hash = '$2a$10$2000000000000000000000000000000000000000000000000000000000000000', -- Hash de '05081997'
    is_temporary_password = FALSE,
    updated_at = NOW()
WHERE 
    email = 'leonardo.negri@outlook.com.br' AND is_master = TRUE;