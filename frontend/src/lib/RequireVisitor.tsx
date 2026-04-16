import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../main";

function RequireVisitor() {
    const { user } = useAuth();

    if (user){
        return <Navigate to="/profile" replace />;
    }

    return <Outlet/>;
}
export default RequireVisitor;

