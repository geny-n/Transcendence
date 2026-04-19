import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../main";

function RequireAdmin(){
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" />;
    }
    if (user.role !== "ADMIN"){
        return <Navigate to="/" />;
    }

    return <Outlet />;
}
export default RequireAdmin;