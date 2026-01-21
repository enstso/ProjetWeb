// frontend/src/App.tsx (exemple de routing)
import {Routes, Route, Navigate} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import {ProtectedRoute} from "./components/ProtectedRoute";
import Profile from "./pages/Profile.tsx";
import GoalDetail from "./pages/goals/GoalDetail.tsx";
import GoalForm from "./pages/goals/GoalForm.tsx";
import GoalsList from "./pages/goals/GoalsList.tsx";
import HabitsList from "./pages/habits/HabitsList";
import HabitForm from "./pages/habits/HabitForm";
import HabitDetail from "./pages/habits/HabitDetail.tsx";

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
            <Route path="/login" element={<Login/>}/>
            <Route path="/register" element={<Register/>}/>

            {/* /dashboard enveloppé par <ProtectedRoute> */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard/>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/profile"
                element={
                    <ProtectedRoute>
                        <Profile/>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/goals"
                element={
                    <ProtectedRoute>
                        <GoalsList/>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/goals/new"
                element={
                    <ProtectedRoute>
                        <GoalForm/>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/goals/:id"
                element={
                    <ProtectedRoute>
                        <GoalDetail/>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/goals/:id/edit"
                element={
                    <ProtectedRoute>
                        <GoalForm/>
                    </ProtectedRoute>
                }
            />
            <Route path="/habits" element={
                <ProtectedRoute>
                    <HabitsList/>
                </ProtectedRoute>}/>
            <Route path="/habits/new" element={
                <ProtectedRoute>
                    <HabitForm/>
                </ProtectedRoute>}/>
            <Route path="/habits/:id/edit" element={
                <ProtectedRoute>
                    <HabitForm/>
                </ProtectedRoute>}/>

            <Route
                path="/habits/:id"
                element={
                    <ProtectedRoute>
                        <HabitDetail/>
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}
