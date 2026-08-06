import React, { useEffect, useState } from 'react';
import './Home.css';
import { apibaseurl, callApi, imgurl } from '../lib';
import ProgressBar from './ProgressBar';
import Profile from './Profile';
import UserManager from './UserManager';
import TaskManager from './TaskManager';

const Home = () => {
    const [fullname, setFullname] = useState("");
    const [rolename, setRolename] = useState("");
    const [isProgress, setIsProgress] = useState(() => !!localStorage.getItem("token"));
    const [menuList, setMenuList] = useState([]);
    const [activeComponent, setActiveComponent] = useState(null);
    const [activeMenu, setActiveMenu] = useState("home");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [stats, setStats] = useState({ tasks: null, users: null });

    useEffect(()=>{
        const storedtoken = localStorage.getItem("token");
        if(!storedtoken)
            logout();
        else{
            callApi("GET", apibaseurl + "/authservice/rbac", null, null, loadRBAC, storedtoken);
            callApi("GET", apibaseurl + "/authservice/profile", null, null, loadProfile, storedtoken);
        }
    }, []);

    function loadProfile(res){
        if(!res?.user)
            return;
        setFullname(res.user[0]?.fullname || fullname);
        setRolename(res.user[1]?.rolename || "");
    }

    function loadRBAC(res){
        setIsProgress(false);
        if(res.code != 200)
            return;
        setFullname(res.fullname);
        setMenuList(res.menulist);

        // Fetch dashboard counts silently (never alert on failure)
        const mids = res.menulist.map(m => m.mid);
        const jwt = localStorage.getItem("token");
        if(mids.includes(3))
            callApi("GET", apibaseurl + "/taskservice/getalltasks/1/1", null, null, tasksStatsHandler, jwt);
        if(mids.includes(4))
            callApi("GET", apibaseurl + "/authservice/getallusers/1/1", null, null, usersStatsHandler, jwt);
    }

    function tasksStatsHandler(res){
        if(res?.code === 200 && res?.totalpages !== undefined)
            setStats(s => ({...s, tasks: res.totalpages}));
    }

    function usersStatsHandler(res){
        if(res?.code === 200 && res?.totalpages !== undefined)
            setStats(s => ({...s, users: res.totalpages}));
    }

    function logout(){
        localStorage.clear();
        window.location.replace("/");
    }

    function loadModule(mid){
        setIsProgress(true);
        setActiveMenu(mid);
        setActiveComponent(null);
        const component = {
            3: <TaskManager logout={logout} />,
            4: <UserManager logout={logout} />,
            5: <Profile logout={logout} />
        };
        setActiveComponent(component[mid]);
        setIsProgress(false);
        setIsMenuOpen(false);
    }

    function goHome(){
        setActiveMenu("home");
        setActiveComponent(null);
        setIsMenuOpen(false);
    }

    function moduleDesc(mid){
        const desc = {
            3: "Create, assign and track tasks with ease.",
            4: "Manage users, roles and access.",
            5: "View and update your profile."
        };
        return desc[mid] || "Open this module to get started.";
    }

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
    const today = new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const initial = (fullname || "U").trim().charAt(0).toUpperCase();
    const hasTaskModule = menuList.some(m => m.mid === 3);
    const hasUserModule = menuList.some(m => m.mid === 4);

    return (
        <div className='home'>
            <div className='home-header'>
                <div className='header-left'>
                    <div className={`menu-toggle ${isMenuOpen ? 'open' : ''}`} onClick={()=>setIsMenuOpen(!isMenuOpen)}>
                        <span></span><span></span><span></span>
                    </div>
                    <div className='brand'>
                        <img src={imgurl + "logo.png"} alt='TaskHub' />
                    </div>
                </div>
                <div className='info'>
                    <label className='today'>{today}</label>
                    <div className='avatar'>{initial}</div>
                    <span className='username'>{fullname}</span>
                    <img className='logout-btn' src={imgurl + "shutdown.png"} alt='Logout' title='Logout' onClick={()=>logout()} />
                </div>
            </div>

            <div className='home-workspace'>
                <div className={`home-menus ${isMenuOpen ? 'open' : ''}`}>
                    <div className='menu-profile'>
                        <div className='avatar'>{initial}</div>
                        <div className='menu-profile-info'>
                            <label>{fullname || "Account"}</label>
                            <span>{rolename || "TaskHub Member"}</span>
                        </div>
                    </div>
                    <ul>
                        <li className={activeMenu === "home" ? 'active' : ''} onClick={()=>goHome()}>
                            <img src={imgurl + "dashboard.png"} alt='' />Dashboard
                        </li>
                        {menuList.map((m)=>(
                            <li key={m.mid} className={activeMenu === m.mid ? 'active' : ''} onClick={()=>loadModule(m.mid)}>
                                <img src={imgurl + (m.micon || "logoico.png")} alt='' />{m.menu}
                            </li>
                        ))}
                    </ul>
                    <ul className='menu-footer'>
                        <li onClick={()=>logout()}>
                            <img src={imgurl + "logout.png"} alt='' />Logout
                        </li>
                    </ul>
                </div>
                <div className='menu-backdrop' onClick={()=>setIsMenuOpen(false)}></div>

                <div className='home-content'>
                    {activeComponent ? activeComponent : (
                        <div className='dash'>
                            <div className='dash-banner'>
                                <div className='dash-banner-info'>
                                    <label>{greeting}, {fullname || "there"}!</label>
                                    <span>{today}</span>
                                    <p>Here's what's happening in your TaskHub workspace today.</p>
                                </div>
                                <img className='dash-banner-logo' src={imgurl + "logo.png"} alt='' />
                            </div>

                            <div className='dash-stats'>
                                {hasTaskModule &&
                                    <div className='stat-card'>
                                        <div className='stat-icon blue'><img src={imgurl + "mytask.png"} alt='' /></div>
                                        <div className='stat-info'>
                                            <label>My Tasks</label>
                                            <span>{stats.tasks !== null ? stats.tasks : "—"}</span>
                                        </div>
                                    </div>
                                }
                                {hasUserModule &&
                                    <div className='stat-card'>
                                        <div className='stat-icon green'><img src={imgurl + "usermanager.png"} alt='' /></div>
                                        <div className='stat-info'>
                                            <label>Users</label>
                                            <span>{stats.users !== null ? stats.users : "—"}</span>
                                        </div>
                                    </div>
                                }
                                <div className='stat-card'>
                                    <div className='stat-icon orange'><img src={imgurl + "dashboard.png"} alt='' /></div>
                                    <div className='stat-info'>
                                        <label>Modules</label>
                                        <span>{menuList.length}</span>
                                    </div>
                                </div>
                            </div>

                            <div className='dash-section'>
                                <label className='dash-title'>Quick Access</label>
                                {menuList.length === 0 ? (
                                    <div className='dash-empty'>No modules are available for your account yet.</div>
                                ) : (
                                    <div className='dash-quick'>
                                        {menuList.map((m)=>(
                                            <div key={m.mid} className='quick-card' onClick={()=>loadModule(m.mid)}>
                                                <img src={imgurl + (m.micon || "logoico.png")} alt='' />
                                                <label>{m.menu}</label>
                                                <span>{moduleDesc(m.mid)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className='dash-lower'>
                                <div className='info-card'>
                                    <label className='dash-title'>Getting Started</label>
                                    <ul>
                                        <li>Choose a module from the menu or the quick access cards.</li>
                                        <li>Create and assign tasks in Task Manager.</li>
                                        <li>Manage users and roles in User Manager.</li>
                                        <li>Keep your profile information up to date.</li>
                                    </ul>
                                </div>
                                <div className='info-card'>
                                    <label className='dash-title'>About TaskHub</label>
                                    <p>TaskHub helps teams stay organised with role based access, task management, user management and personal profiles - all in one secure workspace.</p>
                                    <span className='info-tag'>Secure · Simple · Productive</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className='home-footer'>Copyright @ 2026. All rights reserved.</div>

            <ProgressBar isProgress={isProgress}/>
        </div>
    );
}

export default Home;
