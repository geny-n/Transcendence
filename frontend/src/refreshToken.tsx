import React, { useEffect } from "react";
import { useAuth } from "./main";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export function RefreshProvider({ children } : { children: React.ReactNode }) {
	const { user } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (!user) return;

		const refreshAccess = async () => {
			try {
				await axios.get("/api/refresh", { withCredentials: true });
			} catch (error) {
				if (axios.isAxiosError(error)) {
					if (error.response?.status == 401 || error.response?.status == 403) {
						navigate('/login', { replace: true });
					}
					console.error(error.response?.data?.message);
				}
			}			
		};

		refreshAccess();
		const id = setInterval(refreshAccess, 14 * 60 * 1000);

		return () => clearInterval(id);
	}, [user, navigate])

	return <>{children}</>
}