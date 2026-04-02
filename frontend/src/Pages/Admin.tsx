import { useEffect, useMemo, useState } from 'react'
import './style/admin.css'
import { useAuth, type UserRoles } from '../main'
import axios from 'axios'
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import z from 'zod';
import { ForbidenRegex, PasswordRegex, UserNameRegex } from '../lib/regex';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

type AdminUser = {
	id: string;
	email: string | null;
	username: string;
	avatarUrl: string | null;
	role: UserRoles;
	isOnline: boolean;
	createdAt: string;
	fortyTwoId:	string | null;
	discordId:	string | null
};

type AdminUserResponse = {
	success: boolean;
	usersList: AdminUser[];
	total: number;
	totalPages: number;
}

const roleOptions: UserRoles[] = ['USER','ADMIN']

const emptyStringToUndefined = (value: unknown) => {
	if (typeof value !== 'string') return value;
	const trimmed = value.trim();
	return trimmed === '' ? undefined : trimmed;
}

const createAdminUpdateForm = (t: (key: string) => string) => z.object({
	email: z.preprocess(
		emptyStringToUndefined,
		z
			.email({ message: t('admin.validation.invalidEmail') })
			.trim()
			.optional()
	),
	username: z.preprocess(
		emptyStringToUndefined,
		z
			.string({error: (issue) => issue.input === undefined ? t('admin.validation.string') : ''})
			.trim()
			.min(3, t('admin.validation.usernameMin'))
			.max(24, t('admin.validation.usernameMax'))
			.regex(UserNameRegex, t('admin.validation.usernamePattern'))
			.optional()
	),
	password: z.preprocess(
		emptyStringToUndefined,
		z
			.string({error: (issue) => issue.input === undefined ? t('admin.validation.string') : ''})
			.trim()
			.min(8, t('admin.validation.passwordMin'))
			.regex(PasswordRegex, t('admin.validation.passwordPattern'))
			.regex(ForbidenRegex, t('admin.validation.passwordSpecialChars'))
			.optional()
	)
})

const createAdminCreateForm = (t: (key: string) => string) => z.object({
	email: z.preprocess(
		emptyStringToUndefined,
		z
			.email({ message: t('admin.validation.invalidEmail') })
			.trim()
	),
	username: z.preprocess(
		emptyStringToUndefined,
		z
			.string({error: (issue) => issue.input === undefined ? t('admin.validation.string') : ''})
			.trim()
			.min(3, t('admin.validation.usernameMin'))
			.max(24, t('admin.validation.usernameMax'))
			.regex(UserNameRegex, t('admin.validation.usernamePattern'))
	),
	password: z.preprocess(
		emptyStringToUndefined,
		z
			.string({error: (issue) => issue.input === undefined ? t('admin.validation.string') : ''})
			.trim()
			.min(8, t('admin.validation.passwordMin'))
			.regex(PasswordRegex, t('admin.validation.passwordPattern'))
			.regex(ForbidenRegex, t('admin.validation.passwordSpecialChars'))
	)
})

const admin = () => {
	const { t } = useTranslation()
	const { user } = useAuth()
	const navigate = useNavigate()

	const [users, setUsers] = useState<AdminUser[]>([])
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
	const [message, setMessage] = useState<string>('')
	const [error, setError] = useState<string>('')
	const [loading, setLoading] = useState<boolean>(true)

	const [page, setPage] = useState<number>(1)
	const [size, setSize ] = useState<number>(20)
	const [searchInput, setSearchInput] = useState<string>('')
	const [search, setSearch] = useState<string>('')
	const [sortBy, setSortBy ] = useState<'createdAt' | 'username' | 'email' | 'role' | 'isOnline'>('createdAt')
	const [sortDir, setSortDir ] = useState<'asc' | 'desc'>('desc')
	const [total, setTotal] = useState<number>(0)
	const [totalPages, setTotalPages] = useState<number>(1)
	const [confirmDelete, setConfirmDelete] = useState<boolean>(false)

	const adminUpdateForm = useMemo(() => createAdminUpdateForm(t), [t])
	type UpdateFormValues = z.infer<typeof adminUpdateForm>
	const adminCreateForm = useMemo(() => createAdminCreateForm(t), [t])
	type CreateFormValues = z.infer<typeof adminCreateForm>

	const sortByOptions = useMemo(() => ([
		{ value: 'createdAt' as const, label: t('admin.sort.createdAt') },
		{ value: 'username' as const, label: t('admin.sort.username') },
		{ value: 'email' as const, label: t('admin.sort.email') },
		{ value: 'role' as const, label: t('admin.sort.role') },
		{ value: 'isOnline' as const, label: t('admin.sort.status') },
	]), [t])

	const {
		register: registerUpdate,
		handleSubmit: handleSubmitUpdate,
		reset: resetUpdate,
		formState: { errors: updateErrors }
	} = useForm({ resolver: zodResolver(adminUpdateForm) })

	const {
		register: registerCreate,
		handleSubmit: handleSubmitCreate,
		reset: resetCreate,
		formState: { errors: createErrors }
	} = useForm({ resolver: zodResolver(adminCreateForm) })

	const [formAvatar, setFormAvatar] = useState<File | null>(null)
	const [formRole, setFormRole] = useState<UserRoles>('USER')

	const selectedUser = useMemo(() => users.find((u) => u.id === selectedUserId) ?? null, [users, selectedUserId])

	const resetForm = (target : AdminUser | null) => {
		if (!target) {
			resetUpdate({
				username: '',
				email: '',
				password: ''
			})
			resetCreate({
				username: '',
				email: '',
				password: ''
			})
			setFormAvatar(null);
			return;
		}

		resetUpdate({
			username: target.username,
			email: target.email ?? '',
			password: ''
		})
		setFormAvatar(null);
	}

	const fetchUsers = async () => {
		setLoading(true)
		setMessage('')
		setError('')

		try {
			const response = await axios<AdminUserResponse>(
				'/api/admin/users',
				{
					params: {
						page,
						size,
						sortBy,
						sortDir,
						search
					},
					withCredentials: true
				}
			)
			setUsers(response.data.usersList ?? [])
			setTotal(response.data.total ?? 0)
			setTotalPages(response.data.totalPages ?? 1)
			if (response.data.usersList?.length) {
				const keepCurrentSelection = response.data.usersList.some((entry) => entry.id === selectedUserId)
				const newSelectedUser = keepCurrentSelection ? response.data.usersList.find((entry) => entry.id === selectedUserId)! : response.data.usersList[0]
				setSelectedUserId(newSelectedUser.id)
				resetForm(newSelectedUser)
			} else {
				setSelectedUserId(null)
				resetForm(null);
			}
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const backendMessage = error.response?.data?.message
				setError(typeof backendMessage === 'string' ? t(backendMessage) : t('admin.feedback.loadError'))
			} else {
				setError(t('admin.feedback.unexpectedLoadError'))
			}
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (!user) return;
		if (user.role !== 'ADMIN') {
			navigate('/', { replace: true });
			return;
		}
		void fetchUsers()
	}, [user, page, size, sortBy, sortDir, search])

	const onSearch = () => {
		setPage(1)
		setSearch(searchInput.trim())
	}

	const onRefresh = async () => {
		await fetchUsers()
	}

	const onSelectUser = (target : AdminUser) => {
		setSelectedUserId(target.id)
		resetForm(target)
		setMessage('')
		setError('')
		setConfirmDelete(false)
	}

	const createUser = async (data: CreateFormValues) => {
		setLoading(true)
		setMessage('')
		setError('')

		const { email, username, password } = data

		try {
			await axios.post('/api/register', { email, username, password })

			setMessage(t('admin.feedback.createSuccess'))
			await fetchUsers()
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const backendMessage = error.response?.data?.message
				setError(typeof backendMessage === 'string' ? t(backendMessage) : t('admin.feedback.createError'))
			} else {
				setError(t('admin.feedback.unexpectedCreateError'))
			}
		} finally {
			setLoading(false)
		}
	}

	const updateUser = async (data: UpdateFormValues) => {
		if (!selectedUser) return

		setLoading(true)
		setMessage('')
		setError('')

		try {
			const payload = new FormData()
			if (data.username !== undefined && data.username && data.username !== selectedUser.username) payload.append("username", data.username)
			if (data.email !== undefined && data.email !== (selectedUser.email ?? '')) payload.append("email", data.email)
			if (data.password !== undefined && data.password) payload.append("newPassword", data.password)
			if (formAvatar) payload.append("avatar", formAvatar)

			await axios.put(`/api/admin/users/${selectedUserId}`, payload, {
				withCredentials: true,
			})

			setMessage(t('admin.feedback.updateSuccess'))
			setFormAvatar(null)
			await fetchUsers()
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const backendMessage = error.response?.data?.message
				setError(typeof backendMessage === 'string' ? t(backendMessage) : t('admin.feedback.updateError'))
			} else {
				setError(t('admin.feedback.unexpectedUpdateError'))
			}
		} finally {
			setLoading(false)
		}
	}

	const handleRoleChange = async () => {
		if (!selectedUser) return

		setLoading(true)
		setMessage('')
		setError('')

		try {
			await axios.patch(`/api/admin/users/${selectedUserId}/role`,
				{ role: formRole },
				{ withCredentials: true, }
			)

			setMessage(t('admin.feedback.roleUpdateSuccess'))
			await fetchUsers()
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const backendMessage = error.response?.data?.message
				setError(typeof backendMessage === 'string' ? t(backendMessage) : t('admin.feedback.roleUpdateError'))
			} else {
				setError(t('admin.feedback.unexpectedRoleUpdateError'))
			}
		} finally {
			setLoading(false)
		}
	}

	const handleDeleteUser = async () => {
		if (!selectedUser) return

		setLoading(true)
		setMessage('')
		setError('')
		setConfirmDelete(false)

		try {
			await axios.delete(`/api/admin/users/${selectedUserId}`,
				{ withCredentials: true, }
			)

			setMessage(t('admin.feedback.deleteSuccess'))
			await fetchUsers()
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const backendMessage = error.response?.data?.message
				setError(typeof backendMessage === 'string' ? t(backendMessage) : t('admin.feedback.deleteError'))
			} else {
				setError(t('admin.feedback.unexpectedDeleteError'))
			}
		} finally {
			setLoading(false)
		}
	}

	if (!user) {
		return <div className='admin-page'><p>{t('admin.common.loading')}</p></div>
	}
	
	if (user.role !== 'ADMIN') {
		return null;
	}

	return (
		<div className='admin-page'>
			<div className='admin-header'>
				<h1>{t('admin.header.title')}</h1>
				<p>{t('admin.header.subtitle')}</p>
			</div>

			<div className='admin-toolbar'>
				<input type="text" value={searchInput} placeholder={t('admin.searchPlaceholder')} onChange={(e) => setSearchInput(e.target.value)}/>

				<button type='button' onClick={onSearch}>{t('admin.actions.search')}</button>
				<button type='button' onClick={onRefresh}>{t('admin.actions.refresh')}</button>

				<select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
					{sortByOptions.map((option) => (
						<option key={option.value} value={option.value}>{option.label}</option>
					))}
				</select>

				<select value={sortDir} onChange={(e) => setSortDir(e.target.value as typeof sortDir)}>
					<option value="desc">{t('admin.sort.desc')}</option>
					<option value="asc">{t('admin.sort.asc')}</option>
				</select>

				<select value={size} onChange={(e) => setSize(Number(e.target.value))}>
					<option value={10}>10</option>
					<option value={20}>20</option>
					<option value={50}>50</option>
				</select>
			</div>

			{message ? <p className='admin-message success'>{message}</p> : null}
			{error ? <p className='admin-message error'>{error}</p> : null}

			<section className='admin-create-user'>
				<div className='admin-create-head'>
					<h2>{t('admin.create.title')}</h2>
					<p>{t('admin.create.subtitle')}</p>
				</div>

				<form onSubmit={handleSubmitCreate(createUser)} className='admin-create-form'>
					<label>
						{t('admin.form.username')}
						<input type="text" {...registerCreate('username')} autoComplete='username'/>
						{createErrors.username && <p className='admin-message error'>{createErrors.username.message}</p>}
					</label>

					<label>
						{t('admin.form.email')}
						<input type="email" {...registerCreate('email')} autoComplete='email'/>
						{createErrors.email && <p className='admin-message error'>{createErrors.email.message}</p>}
					</label>

					<label>
						{t('admin.form.password')}
						<input type="password" {...registerCreate('password')} autoComplete='current-password'/>
						{createErrors.password && <p className='admin-message error'>{createErrors.password.message}</p>}
					</label>

					<button type='submit' disabled={loading}>{t('admin.actions.createUser')}</button>
				</form>
			</section>

			<div className='admin-grid'>
				<div className='admin-users-list'>
					<div className='admin-list-head'>
						<span>{t('admin.list.usersCount', { count: total })}</span>
						<span>{t('admin.list.page', { page, totalPages: Math.max(totalPages, 1) })}</span>
					</div>

					{loading ? <p>{t('admin.common.loading')}</p> : null}

					{users.map((entry) => (
						<button type='button' key={entry.id} onClick={() => onSelectUser(entry)} className={`admin-user-item ${selectedUserId === entry.id ? 'active' : ''}`}>
							<div className='admin-user-item-avatar'>
								{entry.avatarUrl ? (
									<img className='avatar' src={entry.discordId || entry.fortyTwoId ? `${entry.avatarUrl}` : `/api/${entry.avatarUrl}`} alt={entry.username} />
								) : (
									<span className='avatar-fallback'>{entry.username.charAt(0).toUpperCase()}</span>
								)}
							</div>
							<div className='admin-user-item-main'>
								<span className='name'>{entry.username}</span>
								<span className='email'>{entry.email}</span>
							</div>
							<div className='admin-user-item-tags'>
								<span className={`tag ${entry.role === 'ADMIN' ? 'tag-admin' : 'tag-user'}`}>{t(`admin.roles.${entry.role}`)}</span>
								<span className={`tag ${entry.isOnline ? 'tag-online' : 'tag-offline'}`}>{entry.isOnline ? t('admin.status.online') : t('admin.status.offline')}</span>
							</div>
						</button>
					))}

					<div className='admin-pagination'>
						<button type='button' disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>{t('admin.actions.previous')}</button>
						<button type='button' disabled={page >= totalPages || loading} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>{t('admin.actions.next')}</button>
					</div>
				</div>

				<div className='admin-editor'>
					{selectedUser ? (
						<>
							<h2>{t('admin.editor.title', { username: selectedUser.username })}</h2>
							<form onSubmit={handleSubmitUpdate(updateUser)} className='admin-form'>
								<label>
									{t('admin.form.username')}
									<input type="text" defaultValue={selectedUser.username} {...registerUpdate('username')} autoComplete='username' />
									{updateErrors.username && <p className='admin-message error'>{updateErrors.username.message}</p>}
								</label>

								<label>
									{t('admin.form.email')}
									<input type="email" defaultValue={selectedUser.email ?? undefined} {...registerUpdate('email')} />
									{updateErrors.email && <p className='admin-message error'>{updateErrors.email.message}</p>}
								</label>

								<label>
									{t('admin.form.newPassword')}
									<input
										type="password"
										{...registerUpdate('password')}
										autoComplete='new-password'
										placeholder={t('admin.form.passwordPlaceholder')}
									/>
									{updateErrors.password && <p className='admin-message error'>{updateErrors.password.message}</p>}
								</label>

								<label>
									{t('admin.form.avatar')}
									<input type="file" accept='image/' onChange={(e) => {setFormAvatar(e.target.files?.[0] ?? null)}}/>
								</label>

								<button type='submit' disabled={loading}>{t('admin.actions.saveChanges')}</button>
							</form>

							<div className='admin-role-box'>
								<h3>{t('admin.role.title')}</h3>
								<select value={formRole} onChange={(e) => setFormRole(e.target.value as UserRoles)}>
									{roleOptions.map((role) => (
										<option key={role} value={role}>{t(`admin.roles.${role}`)}</option>
									))}
								</select>
								<button type='submit' disabled={loading || formRole === selectedUser.role} onClick={handleRoleChange}>
									{t('admin.actions.updateRole')}
								</button>
							</div>

							<div className='admin-danger-zone'>
								<h3>{t('admin.delete.title')}</h3>
							{!confirmDelete ? (
								<button type='button' disabled={loading || user?.id === selectedUserId} onClick={() => setConfirmDelete(true)}>
									{t('admin.actions.deleteUser')}
								</button>
							) : (
								<div className='admin-confirm-delete'>
									<span>{t('admin.delete.confirmMessage', { username: selectedUser.username })}</span>
									<button type='button' disabled={loading} onClick={handleDeleteUser}>{t('admin.actions.confirm')}</button>
									<button type='button' disabled={loading} onClick={() => setConfirmDelete(false)}>{t('admin.actions.cancel')}</button>
								</div>
							)}
							</div>
						</>
					) : (
						<p>{t('admin.emptyState')}</p>
					)}
				</div>
			</div>
		</div>
	)
}

export default admin