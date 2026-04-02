'use client';
import { UserForm } from '@/components/business/users/UserForm';
import { useUsersStore } from '@/stores/usersStore';
import { useAuthStore } from '@/stores/authStore';
import { User } from '@/types';

export default function NewUserPage() {
    const { saveUser } = useUsersStore();
    const currentUser = useAuthStore(s => s.currentUser);

    const handleSave = async (payload: User) => {
        if (!currentUser?.tenantId) return;
        await saveUser({ ...payload, tenantId: currentUser.tenantId });
    };

    return <UserForm onSave={handleSave} />;
}
