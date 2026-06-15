import React, { useEffect, useState } from 'react';
import './Profile.css';
import { apibaseurl, callApi, imgurl } from '../lib';

const Profile = ({logout}) => {
    const [data, setData] = useState(null);
    const [token, setToken] = useState("");

    useEffect(()=>{
        const storedtoken = localStorage.getItem("token");
        if(storedtoken == undefined || storedtoken == "")
            return logout();
            
        setToken(storedtoken);
        callApi("GET", apibaseurl + "/authservice/profile", null, null, loadData, storedtoken);
        
    },[]);

    function loadData(res){
        setData(res);
    }
    
    if(!data) return ("");

    return (
        <div className='profile'>
            <div className='container'>
                <div className='info'>
                    <img src={imgurl + "user.png"} alt='' />
                    <div className='info-data'>
                        <label>{data.user[0].fullname}</label>
                        <span>{data.user[1].rolename}</span>
                    </div>
                </div>
                <div className='details'>
                    <div className='grid'>
                        <span>Name</span>
                        <span>{data.user[0].fullname}</span>
                    </div>
                    <div className='grid'>
                        <span>Phone Number</span>
                        <span>{data.user[0].phone}</span>
                    </div>
                    <div className='grid'>
                        <span>Email</span>
                        <span>{data.user[0].email}</span>
                    </div>
                    <div className='grid'>
                        <span>Role</span>
                        <span>{data.user[1].rolename}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;
