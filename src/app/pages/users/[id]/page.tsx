'use client';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { UserForm } from '@/components/business/users/UserForm';
import { useUsersStore } from '@/stores/usersStore';
import { useAuthStore } from '@/stores/authStore';
import { User } from '@/types';

export default function EditUserPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const isReadOnly = searchParams.get('readOnly') === 'true';
    
    const { users, saveUser, fetchUsers } = useUsersStore();
    const currentUser = useAuthStore(s => s.currentUser);

    useEffect(() => {
        if (currentUser?.tenantId && users.length === 0) {
            fetchUsers(currentUser.tenantId);
        }
    }, [currentUser, users.length, fetchUsers]);

    const user = users.find(u => u.id === params.id) || null;

    const handleSave = async (payload: User) => {
        if (!currentUser?.tenantId) return;
        await saveUser({ ...payload, tenantId: currentUser.tenantId });
    };

    if (!user && users.length > 0) {
        return <div className="p-8 text-center">Usuário não encontrado.</div>;
    }

    if (!user) {
        return <div className="p-8 text-center flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            Carregando usuário...
        </div>;
    }

    return <UserForm onSave={handleSave} editingUser={user} isReadOnly={isReadOnly} />;
}
