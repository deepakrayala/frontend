import React, { useEffect, useState } from 'react';
import './Home.css';
import { apibaseurl, callApi, imgurl } from '../lib';
import ProgressBar from './ProgressBar';
import Profile from './Profile';
import UserManager from './UserManager';
import TaskManager from './TaskManager';
import MyTasks from './MyTasks';

const Home = () => {
    const [fullname, setFullname] = useState("");
    const [rolename, setRolename] = useState("");
    const [isProgress, setIsProgress] = useState(() => !!localStorage.getItem("token"));
    const [menuList, setMenuList] = useState([]);
    const [activeComponent, setActiveimport React, { useEffect, useState } from 'react';
import './Home.css';
import { apibaseurl, callApi, imgurl } from '../lib';
import ProgressBar from './ProgressBar';
import Profile from './Profile';
import UserManager from './UserManager';
import TaskManager from './TaskManager';
import MyTasks from './MyTasks';

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
        const me = res.user[0];
        setFullname(me?.fullname || fullname);
        setRolename(res.user[1]?.rolename || "");
        // Count only the tasks assigned to this account (by id, _id or email)
        if(me)
            callApi("GET", apibaseurl + "/taskservice/getalltasks/1/50", null, null, (r) => countTasksPage(r, me.email || "", me.id, me._id), localStorage.getItem("token"));
    }

    function countTasksPage(res, email, myid, myoid){
        if(res?.code !== 200){
            setStats(s => ({...s, tasks: 0}));
            return;
        }
        const collected = [...(res.tasks || [])];
        const total = Math.min(res.totalpages || 1, 20);
        if(total <= 1){
            countTasksFinish(collected, email, myid, myoid);
            return;
        }
        let pending = total - 1;
        for(let p = 2; p <= total; p++){
            callApi("GET", apibaseurl + "/taskservice/getalltasks/" + p + "/50", null, null, (r) => {
                if(r?.code === 200 && r.tasks)
                    collected.push(...r.tasks);
                pending--;
                if(pending === 0)
                    countTasksFinish(collected, email, myid, myoid);
            }, localStorage.getItem("token"));
        }
    }

    function countTasksFinish(all, email, myid, myoid){
        const idSet = new Set([myid, myoid].filter(v => v !== undefined && v !== null && v !== "").map(v => String(v).trim().toLowerCase()));
        const emailStr = String(email || "").trim().toLowerCase();
        const assigned = all.filter(t => {
            if(!t) return false;
            const a = t.assignedto !== undefined && t.assignedto !== null ? String(t.assignedto).trim().toLowerCase() : "";
            if(a === "") return false;
            if(idSet.has(a)) return true;
            if(emailStr !== "" && a === emailStr) return true;
            return false;
        }).length;
        setStats(s => ({...s, tasks: assigned}));
    }

    function loadRBAC(res){
        setIsProgress(false);
        if(res.code != 200)
            return;
        setFullname(res.fullname);
        // The app provides its own Dashboard entry, so ignore any dashboard menu item from the backend
        const menus = res.menulist.filter(m => (m.menu || "").toLowerCase() !== "dashboard");
        setMenuList(menus);

        // Fetch user count silently (never alert on failure)
        const mids = menus.map(m => m.mid);
        const jwt = localStorage.getItem("token");
        if(mids.includes(4))
            callApi("GET", apibaseurl + "/authservice/getallusers/1/1", null, null, usersStatsHandler, jwt);
    }

    function usersStatsHandler(res){
        if(res?.code === 200 && res?.totalpages !== undefined)
            setStats(s => ({...s, users: res.totalpages}));
    }

    function logout(){
        localStorage.clear();
        window.location.replace("/");
    }

    function loadModule(key){
        setIsProgress(true);
        setActiveMenu(key);
        setActiveComponent(null);
        let component = null;
        // "mytask" is the app-level entry shown to every account (even when RBAC omits it)
        if(key === "mytask")
            component = <MyTasks logout={logout} />;
        else{
            const menu = menuList.find(m => m.mid === key);
            if(menu && /^my\s*tasks?$/i.test(menu.menu || ""))
                component = <MyTasks logout={logout} />;
            else
                component = {
                    3: <TaskManager logout={logout} />,
                    4: <UserManager logout={logout} />,
                    5: <Profile logout={logout} />
                }[key];
        }
        setActiveComponent(component);
        setIsProgress(false);
        setIsMenuOpen(false);
    }

    function goHome(){
        setActiveMenu("home");
        setActiveComponent(null);
        setIsMenuOpen(false);
    }

    function moduleDesc(mid){
        const menu = menuList.find(m => m.mid === mid);
        if(menu && /^my\s*tasks?$/i.test(menu.menu || ""))
            return "Tasks assigned to your account.";
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
    const hasUserModule = menuList.some(m => m.mid === 4);
    const hasMyTaskMenu = menuList.some(m => /^my\s*tasks?$/i.test(m.menu || ""));

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
                        {!hasMyTaskMenu &&
                            <li className={activeMenu === "mytask" ? 'active' : ''} onClick={()=>loadModule("mytask")}>
                                <img src={imgurl + "mytask.png"} alt='' />My Task
                            </li>
                        }
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
                                    <label>{greeting}{fullname ? `, ${fullname}` : ""}!</label>
                                    <span>{today}</span>
                                    <p>Here's what's happening in your TaskHub workspace today.</p>
                                </div>
                                <img className='dash-banner-logo' src={imgurl + "logo.png"} alt='' />
                            </div>

                            <div className='dash-stats'>
                                <div className='stat-card'>
                                    <div className='stat-icon blue'><img src={imgurl + "mytask.png"} alt='' /></div>
                                    <div className='stat-info'>
                                        <label>My Tasks</label>
                                        <span>{stats.tasks !== null ? stats.tasks : "—"}</span>
                                    </div>
                                </div>
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
                                        {!hasMyTaskMenu &&
                                            <div className='quick-card' onClick={()=>loadModule("mytask")}>
                                                <img src={imgurl + "mytask.png"} alt='' />
                                                <label>My Task</label>
                                                <span>Tasks assigned to your account.</span>
                                            </div>
                                        }
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
Component] = useState(null);
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
        const me = res.user[0];
        setFullname(me?.fullname || fullname);
        setRolename(res.user[1]?.rolename || "");
        // Count only the tasks assigned to this account (by id, _id or email)
        if(me)
            callApi("GET", apibaseurl + "/taskservice/getalltasks/1/50", null, null, (r) => countTasksPage(r, me.email || "", me.id, me._id), localStorage.getItem("token"));
    }

    function countTasksPage(res, email, myid, myoid){
        if(res?.code !== 200){
            setStats(s => ({...s, tasks: 0}));
            return;
        }
        const collected = [...(res.tasks || [])];
        const total = Math.min(res.totalpages || 1, 20);
        if(total <= 1){
            countTasksFinish(collected, email, myid, myoid);
            return;
        }
        let pending = total - 1;
        for(let p = 2; p <= total; p++){
            callApi("GET", apibaseurl + "/taskservice/getalltasks/" + p + "/50", null, null, (r) => {
                if(r?.code === 200 && r.tasks)
                    collected.push(...r.tasks);
                pending--;
                if(pending === 0)
                    countTasksFinish(collected, email, myid, myoid);
            }, localStorage.getItem("token"));
        }
    }

    function countTasksFinish(all, email, myid, myoid){
        const idSet = new Set([myid, myoid].filter(v => v !== undefined && v !== null && v !== "").map(v => String(v).trim().toLowerCase()));
        const emailStr = String(email || "").trim().toLowerCase();
        const assigned = all.filter(t => {
            if(!t) return false;
            const a = t.assignedto !== undefined && t.assignedto !== null ? String(t.assignedto).trim().toLowerCase() : "";
            if(a === "") return false;
            if(idSet.has(a)) return true;
            if(emailStr !== "" && a === emailStr) return true;
            return false;
        }).length;
        setStats(s => ({...s, tasks: assigned}));
    }

    function loadRBAC(res){
        setIsProgress(false);
        if(res.code != 200)
            return;
        setFullname(res.fullname);
        // The app provides its own Dashboard entry, so ignore any dashboard menu item from the backend
        const menus = res.menulist.filter(m => (m.menu || "").toLowerCase() !== "dashboard");
        setMenuList(menus);

        // Fetch user count silently (never alert on failure)
        const mids = menus.map(m => m.mid);
        const jwt = localStorage.getItem("token");
        if(mids.includes(4))
            callApi("GET", apibaseurl + "/authservice/getallusers/1/1", null, null, usersStatsHandler, jwt);
    }

    function usersStatsHandler(res){
        if(res?.code === 200 && res?.totalpages !== undefined)
            setStats(s => ({...s, users: res.totalpages}));
    }

    function logout(){
        localStorage.clear();
        window.location.replace("/");
    }

    function loadModule(key){
        setIsProgress(true);
        setActiveMenu(key);
        setActiveComponent(null);
        let component = null;
        // "mytask" is the app-level entry shown to every account (even when RBAC omits it)
        if(key === "mytask")
            component = <MyTasks logout={logout} />;
        else{
            const menu = menuList.find(m => m.mid === key);
            if(menu && /^my\s*tasks?$/i.test(menu.menu || ""))
                component = <MyTasks logout={logout} />;
            else
                component = {
                    3: <TaskManager logout={logout} />,
                    4: <UserManager logout={logout} />,
                    5: <Profile logout={logout} />
                }[key];
        }
        setActiveComponent(component);
        setIsProgress(false);
        setIsMenuOpen(false);
    }

    function goHome(){
        setActiveMenu("home");
        setActiveComponent(null);
        setIsMenuOpen(false);
    }

    function moduleDesc(mid){
        const menu = menuList.find(m => m.mid === mid);
        if(menu && /^my\s*tasks?$/i.test(menu.menu || ""))
            return "Tasks assigned to your account.";
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
    const hasUserModule = menuList.some(m => m.mid === 4);
    const hasMyTaskMenu = menuList.some(m => /^my\s*tasks?$/i.test(m.menu || ""));

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
                        {!hasMyTaskMenu &&
                            <li className={activeMenu === "mytask" ? 'active' : ''} onClick={()=>loadModule("mytask")}>
                                <img src={imgurl + "mytask.png"} alt='' />My Task
                            </li>
                        }
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
                                    <label>{greeting}{fullname ? `, ${fullname}` : ""}!</label>
                                    <span>{today}</span>
                                    <p>Here's what's happening in your TaskHub workspace today.</p>
                                </div>
                                <img className='dash-banner-logo' src={imgurl + "logo.png"} alt='' />
                            </div>

                            <div className='dash-stats'>
                                <div className='stat-card'>
                                    <div className='stat-icon blue'><img src={imgurl + "mytask.png"} alt='' /></div>
                                    <div className='stat-info'>
                                        <label>My Tasks</label>
                                        <span>{stats.tasks !== null ? stats.tasks : "—"}</span>
                                    </div>
                                </div>
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
                                        {!hasMyTaskMenu &&
                                            <div className='quick-card' onClick={()=>loadModule("mytask")}>
                                                <img src={imgurl + "mytask.png"} alt='' />
                                                <label>My Task</label>
                                                <span>Tasks assigned to your account.</span>
                                            </div>
                                        }
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
