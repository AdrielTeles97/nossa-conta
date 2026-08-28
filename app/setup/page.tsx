// src/app/setup/page.tsx
'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SetupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const handleCreateUser = async () => {
        const { data, error } = await authClient.signUp.email({
            email,
            password,
            name,
        });

        if (error) {
            alert('Erro ao criar: ' + error.message);
        } else {
            alert(
                'Usuário criado com sucesso! Pode apagar este arquivo agora e ir para /login.'
            );
        }
    };

    return (
        <div className="p-10 space-y-4 max-w-sm">
            <h1 className="text-xl font-bold">Criar Admin (Setup)</h1>
            <Input
                placeholder="Nome"
                value={name}
                onChange={e => setName(e.target.value)}
            />
            <Input
                placeholder="E-mail"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
            />
            <Input
                placeholder="Senha"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
            />
            <Button onClick={handleCreateUser}>Criar Usuário</Button>
        </div>
    );
}
