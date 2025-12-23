'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
    Plus,
    Trash2,
    CheckCircle2,
    Circle,
    Edit2,
    Save,
    X,
    Key,
    Building2,
    User,
    LayoutGrid,
    ExternalLink,
    AlertCircle
} from 'lucide-react';
import { toast } from '@myapp/ui/sonner';
import { Button } from '@myapp/ui/components/button';
import { Input } from '@myapp/ui/components/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@myapp/ui/components/card';
import { Badge } from '@myapp/ui/components/badge';
import { Separator } from '@myapp/ui/components/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@myapp/ui/components/dialog';

interface CoupangCredential {
    id: string;
    alias: string | null;
    isActive: boolean;
    accessKey: string;
    vendorId: string;
    vendorUserId: string | null;
    createdAt: string;
}

export default function SettingsPage() {
    const t = useTranslations('SettingsPage.Coupang');

    const [accounts, setAccounts] = useState<CoupangCredential[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        alias: '',
        accessKey: '',
        secretKey: '',
        vendorId: '',
        vendorUserId: '',
    });

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editAlias, setEditAlias] = useState('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/settings/coupang');
            const data = await res.json();
            if (res.ok) {
                setAccounts(data.credentials || []);
            }
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
            toast.error('계정 목록을 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/settings/coupang', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to add');

            toast.success(t('form.success'));
            setFormData({ alias: '', accessKey: '', secretKey: '', vendorId: '', vendorUserId: '' });
            setIsAddDialogOpen(false);
            fetchAccounts();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleActive = async (id: string) => {
        try {
            const res = await fetch('/api/settings/coupang', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isActive: true }),
            });
            if (!res.ok) throw new Error('Failed to update');
            toast.success('사용 계정이 변경되었습니다.');
            fetchAccounts();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleDelete = async (id: string, alias: string | null) => {
        if (!confirm(`'${alias || id}' 계정을 삭제하시겠습니까?`)) return;
        try {
            const res = await fetch(`/api/settings/coupang?id=${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete');
            toast.success('계정이 삭제되었습니다.');
            fetchAccounts();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleUpdateAlias = async (id: string) => {
        try {
            const res = await fetch('/api/settings/coupang', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, alias: editAlias }),
            });
            if (!res.ok) throw new Error('Failed to update alias');
            toast.success('별칭이 수정되었습니다.');
            setEditingId(null);
            fetchAccounts();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <header className="flex justify-between items-end">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('description')}</p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            {t('form.submit')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{t('form.title')}</DialogTitle>
                            <DialogDescription>
                                쿠팡 Wing API 정보를 입력하여 새로운 판매자 계정을 추가합니다.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddAccount} className="space-y-4 py-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('form.alias')}</label>
                                <Input
                                    value={formData.alias}
                                    onChange={e => setFormData({ ...formData, alias: e.target.value })}
                                    placeholder="예: 메인 스토어"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">{t('form.accessKey')}</label>
                                    <Input
                                        required
                                        value={formData.accessKey}
                                        onChange={e => setFormData({ ...formData, accessKey: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">{t('form.secretKey')}</label>
                                    <Input
                                        type="password"
                                        required
                                        value={formData.secretKey}
                                        onChange={e => setFormData({ ...formData, secretKey: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">{t('form.vendorId')}</label>
                                    <Input
                                        required
                                        placeholder="A00XXXXXX"
                                        value={formData.vendorId}
                                        onChange={e => setFormData({ ...formData, vendorId: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">{t('form.vendorUserId')}</label>
                                    <Input
                                        placeholder="Coupang ID"
                                        value={formData.vendorUserId}
                                        onChange={e => setFormData({ ...formData, vendorUserId: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter className="pt-4">
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? t('form.saving') : t('form.submit')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </header>

            <Separator />

            <div className="grid gap-6">
                <div className="flex items-center gap-2 text-lg font-semibold">
                    <LayoutGrid className="w-5 h-5 text-blue-600" />
                    <h2>{t('list.title')}</h2>
                    <Badge variant="outline" className="ml-2 font-normal">
                        {accounts.length} Accounts
                    </Badge>
                </div>

                {isLoading ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {[1, 2].map(i => (
                            <Card key={i} className="animate-pulse">
                                <CardHeader className="h-24 bg-gray-50 rounded-t-lg" />
                                <CardContent className="h-32" />
                            </Card>
                        ))}
                    </div>
                ) : accounts.length === 0 ? (
                    <Card className="border-dashed flex flex-col items-center justify-center p-12 bg-gray-50/50">
                        <Building2 className="w-12 h-12 text-gray-300 mb-4" />
                        <p className="text-muted-foreground">{t('list.empty')}</p>
                        <Button variant="link" onClick={() => setIsAddDialogOpen(true)} className="mt-2">
                            첫 번째 계정을 연결해보세요
                        </Button>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                        {accounts.map(account => (
                            <Card key={account.id} className={`transition-all duration-200 ${account.isActive ? 'ring-2 ring-blue-500 shadow-md translate-y-[-2px]' : 'hover:border-gray-300'}`}>
                                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                    <div className="space-y-1 pr-4 flex-1">
                                        {editingId === account.id ? (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    autoFocus
                                                    value={editAlias}
                                                    onChange={e => setEditAlias(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleUpdateAlias(account.id)}
                                                    className="h-8"
                                                />
                                                <Button size="icon" variant="ghost" onClick={() => handleUpdateAlias(account.id)} className="h-8 w-8 text-green-600">
                                                    <Save className="w-4 h-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} className="h-8 w-8 text-red-600">
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center group">
                                                <h3 className="font-bold text-lg leading-none truncate max-w-[200px]">
                                                    {account.alias || account.vendorId}
                                                </h3>
                                                <button
                                                    onClick={() => { setEditingId(account.id); setEditAlias(account.alias || ''); }}
                                                    className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Building2 className="w-3.5 h-3.5" />
                                            <span>{account.vendorId}</span>
                                            {account.vendorUserId && (
                                                <>
                                                    <Separator orientation="vertical" className="h-3" />
                                                    <User className="w-3.5 h-3.5" />
                                                    <span>{account.vendorUserId}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {account.isActive ? (
                                        <Badge className="bg-blue-600 hover:bg-blue-600 pointer-events-none">
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            {t('list.active')}
                                        </Badge>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleToggleActive(account.id)}
                                            className="h-7 px-2 text-xs text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                                        >
                                            <Circle className="w-3 h-3 mr-1" />
                                            {t('list.setActive')}
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent className="pt-2">
                                    <div className="bg-gray-50 rounded-md p-3 space-y-1.5 border border-gray-100">
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Key className="w-3 h-3" />
                                                <span>API Key</span>
                                            </div>
                                            <code className="bg-white px-1.5 py-0.5 rounded border border-gray-100 text-[10px] text-gray-500">
                                                {account.accessKey}
                                            </code>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                                            <span>{new Date(account.createdAt).toLocaleDateString()} 등록됨</span>
                                            <a
                                                href="https://wing.coupang.com"
                                                target="_blank"
                                                className="hover:underline flex items-center gap-0.5"
                                            >
                                                Wing 바로가기 <ExternalLink className="w-2.5 h-2.5" />
                                            </a>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end gap-2 pt-0 pb-3">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(account.id, account.alias)}
                                        className="h-8 text-xs text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                                        {t('list.delete')}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div className="space-y-1">
                    <p className="font-semibold">도움말: 여러 계정 사용 시 주의사항</p>
                    <ul className="list-disc list-inside space-y-0.5 opacity-90">
                        <li><b>사용 중</b>으로 설정된 계정이 상품 등록 및 배송지 조회에 사용됩니다.</li>
                        <li>각 계정별로 별칭을 지정하여 쉽게 구분할 수 있습니다.</li>
                        <li>키가 만료되거나 잘못된 경우 API 호출 시 오류가 발생할 수 있으니 수시로 확인해주세요.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
