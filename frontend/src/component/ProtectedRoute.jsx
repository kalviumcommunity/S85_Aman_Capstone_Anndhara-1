import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const storedUser = localStorage.getItem("user");
  const token = storedUser ? JSON.parse(storedUser).token : null;
  return token ? children : <Navigate to="/login" />;
};
export default ProtectedRoute;
