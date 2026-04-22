import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../main";

function RequireAuth() {
	const { user, loadingAuth } = useAuth();

	if (loadingAuth === true) {
		return <div>Loading...</div>;
	}
	if (!user) {
		return <Navigate to="/login" replace />;
	}

	return <Outlet/>;
}
export default RequireAuth;

