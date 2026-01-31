import React from 'react'
import './Navbar.css'
import { NavLink } from 'react-router-dom'

const listItems = [
  {label: "Home", path: "/"},
  {label: "Pong", path: "/pong"},
  {label: "ScoreBoard", path: "/scoreBoard"},
  {label: "Teams", path: "/teams"},
  {label: "Chat", path: "/chat"}
]

const Navbar: React.FC = () => {
  return (
    <div className="nav-style">

  <ul className="flex gap-8 text-xl">
        {listItems.map(({ label, path }) => (
            <NavLink className="relative group cursor-pointer"
                key={label} to={path}>
                {label}
                <span className="btn-nav"></span>
            </NavLink>
        ))}
  </ul>

  <NavLink to="/login" className="btn-login">Connexion</NavLink>
</div>
  )
}

export default Navbar
