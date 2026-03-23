import React, { createContext, useContext, useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './language.tsx'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import { RefreshProvider } from './refreshToken.tsx'


export type UserRoles = "USER" | "ADMIN" | "GUEST"

export type User = {
		id: string;
		email: string | null;
		username: string;
		avatarUrl: string | null;
		role: UserRoles;
}

interface AuthContextType {
	user: User | null;
	setUser: React.Dispatch<React.SetStateAction<User | null>>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		const fetchMe = async () => {
			try {
				const response = await axios.get('/api/users/me', { withCredentials: true })
				setUser(response.data?.user)
			} catch {
				setUser(null)
			}
		}

		fetchMe()
	}, [])

	return (
		<AuthContext.Provider value={{ user, setUser }}>
			{children}
		</AuthContext.Provider>
	)
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
	<AuthProvider>
		<React.StrictMode>
			<BrowserRouter>
				<RefreshProvider>
					<App />
				</RefreshProvider>
			</BrowserRouter>
		</React.StrictMode>
	</AuthProvider>
)
