import React from 'react';
import './App.css';
import {BrowserRouter, Route, Routes} from "react-router-dom";

import Layout from './components/Layout';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Studios from './pages/Studios';
import SubscriptionsList from './pages/SubscriptionsList';
import Register from './pages/Register';
import Login from './pages/Login';
import Logout from './pages/Logout';
import StudioDetails from './pages/StudioDetails';
import UserSchedule from "./pages/UserSchedule";

import UserContext, {useUserContext} from './contexts/userContext';
import SubscriptionContext, {useSubscriptionContext} from './contexts/subscriptionContext';

function App() {
    return (
        <UserContext.Provider value={useUserContext()}>
            <SubscriptionContext.Provider value={useSubscriptionContext()}>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Layout/>}>
                            <Route index element={<Home/>}/>
                            <Route path="profile" element={<Profile/>}/>
                            <Route path="register" element={<Register/>}/>
                            <Route path="login" element={<Login/>}/>
                            <Route path="logout" element={<Logout/>}/>
                            <Route path="studios" element={<Studios/>}/>
                            <Route path="studios/:studioId" element={<StudioDetails/>}/>
                            <Route path="subscription" element={<SubscriptionsList/>}/>
                            <Route path="schedule" element={<UserSchedule/>}/>
                        </Route>
                    </Routes>
                </BrowserRouter>
            </SubscriptionContext.Provider>
        </UserContext.Provider>
    );
}

export default App;
