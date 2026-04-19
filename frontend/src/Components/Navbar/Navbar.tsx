import React, { useState, useRef, useEffect } from 'react'
import './Navbar.css'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../main'

const Navbar: React.FC = () => {
	const { t, i18n } = useTranslation()
	const { user } = useAuth();
	const location = useLocation();
	const isInMatchmaking = location.pathname === '/matchmaking';
	const [menuOpen, setMenuOpen] = useState(false)

	const listItems = [
		{label: t('navbar.home'), path: "/"},
		{label: t('navbar.pong'), path: "/pong"},
		{label: t('navbar.scoreboard'), path: "/scoreBoard"},
		{label: "Leaderboard", path: "/leaderboard"},
		{label: t('navbar.chat'), path: "/chat"},
		{label: t('navbar.about'), path: "/about"},
		...(user?.role === 'ADMIN' ? [{label: t('navbar.admin'), path: "/admin"}] : [])
	]

	const changeLanguage = (lng: string) => {
		if (lng === "ar")
			document.documentElement.dir = "rtl";
		else
			document.documentElement.dir = "ltl";
		i18n.changeLanguage(lng);
	}

	const dropdownRef = useRef<HTMLUListElement | null>(null);
	const buttonRef = useRef<HTMLButtonElement | null>(null);

	useEffect(() => {
		function handleClickOut(event: MouseEvent) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
				buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
				setMenuOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClickOut);

		 return () => {
			document.removeEventListener("mousedown", handleClickOut);
		 };
	}, []);

	return (
		<div className={`nav-style ${isInMatchmaking ? 'nav-disabled' : ''}`}>
			<button ref={buttonRef} className="dropdown-icon" onClick={() => setMenuOpen((prev) => !prev)} disabled={isInMatchmaking}>
				☰
			</button>

			{menuOpen && !isInMatchmaking && (
				<ul ref={dropdownRef} className="dropdown-menu inset-e-5">
					{listItems.map(({ label, path }) => (
						<NavLink className="text-white hover:bg-orange-600" onClick={() => setMenuOpen(false)} key={label} to={path}>
							{label}
						</NavLink> ))}
				</ul>
			)}

			<ul className="hidden lg:flex gap-8 text-xl whitespace-nowrap">
				{listItems.map(({ label, path }) => (
					<NavLink className="relative group cursor-pointer" key={label} to={path}>
						{label}
						<span className="btn-nav"></span>
					</NavLink> ))}
			</ul>
			
			{...(user?.role === 'ADMIN' || user?.role ==='USER' 
				? [<NavLink to="/profile" className="btn-login">{t('navbar.profile')}</NavLink>] 
				: [<NavLink to="/login" className="btn-login">{t('navbar.login')}</NavLink>])}
			
			<select onChange={(e) => changeLanguage(e.target.value)} value={i18n.language}>
				<option value="fr">FR</option>
				<option value="en">EN</option>
				<option value="es">ES</option>
				<option value="ar">AR</option>
			</select>
		</div>
	)
}

export default Navbar
