import React, { useState } from 'react'
import './Navbar.css'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../main'

const Navbar: React.FC = () => {
	const { t, i18n } = useTranslation()
	const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false)

	const listItems = [
		{label: t('navbar.home'), path: "/"},
		{label: t('navbar.pong'), path: "/pong"},
		{label: t('navbar.scoreboard'), path: "/scoreBoard"},
		// {label: t('navbar.teams'), path: "/teams"},
		{label: t('navbar.chat'), path: "/chat"},
		{label: t('navbar.profile'), path: "/profile"},
		...(user?.role === 'ADMIN' ? [{label: t('navbar.admin'), path: "/admin"}] : [])
	]

	const changeLanguage = (lng: string) => {
		if (lng === "ar")
			document.documentElement.dir = "rtl";
		else
			document.documentElement.dir = "ltl";
		i18n.changeLanguage(lng);
	}
	return (
		<div className="nav-style">
			<button className="dropdown-icon" onClick={() => setMenuOpen(!menuOpen)}>
				☰
			</button>

			{menuOpen && (
				<ul className="dropdown-menu">
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

			<NavLink to="/login" className="btn-login">{t('navbar.login')}</NavLink>
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
