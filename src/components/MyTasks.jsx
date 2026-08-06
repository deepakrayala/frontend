import React, { useEffect, useState } from 'react';
import './MyTasks.css';
import { apibaseurl, callApi, imgurl } from '../lib';

const MyTasks = ({logout}) => {
    const [myTasks, setMyTasks] = useState(null);

    function loadProfile(res){
        const me = res?.user?.[0];
        if(!me){
            setMyTasks([]);
            return;
        }
        fetchAllTasks(me.email || "");
    }

    function fetchAllTasks(email){
        callApi("GET", apibaseurl + "/taskservice/getalltasks/1/50", null, null, (res) => handlePage(res, email), localStorage.getItem("token"));
    }

    function handlePage(res, email){
        if(res.code !== 200){
            setMyTasks([]);
            return;
        }
        const collected = [...(res.tasks || [])];
        const total = Math.min(res.totalpages || 1, 20);
        if(total <= 1){
            finish(collected, email);
            return;
        }
        let pending = total - 1;
        for(let p = 2; p <= total; p++){
            callApi("GET", apibaseurl + "/taskservice/getalltasks/" + p + "/50", null, null, (r) => {
                if(r.code === 200 && r.tasks)
                    collected.push(...r.tasks);
                pending--;
                if(pending === 0)
                    finish(collected, email);
            }, localStorage.getItem("token"));
        }
    }

    function finish(all, email) {
    const emailStr = String(email || "").toLowerCase();

    setMyTasks(
        all.filter(task =>
            String(task.assignedto || "").toLowerCase() === emailStr
        )
    );
}



    useEffect(()=>{
        const storedtoken = localStorage.getItem("token");
        if(storedtoken == undefined || storedtoken == "")
            return logout();

        callApi("GET", apibaseurl + "/authservice/profile", null, null, loadProfile, storedtoken);
    },[]);

    return (
        <div className='mtasks'>
            <div className='mtasks-header'>
                <label>My Tasks</label>
                {myTasks && <span className='mtasks-count'>{myTasks.length} assigned to you</span>}
            </div>
            <div className='mtasks-content'>
                {myTasks === null ? (
                    <div className='mtasks-loading'>Loading your tasks...</div>
                ) : myTasks.length === 0 ? (
                    <div className='mtasks-empty'>
                        <img src={imgurl + "mytask.png"} alt='' />
                        <label>No tasks assigned to you yet.</label>
                        <span>Tasks shared with your account will appear here.</span>
                    </div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th style={{'width':'50px'}}>S#</th>
                                <th style={{'width':'200px'}}>Title</th>
                                <th style={{'width':'250px'}}>Description</th>
                                <th style={{'width':'100px'}}>Priority</th>
                                <th style={{'width':'100px'}}>Deadline</th>
                                <th style={{'width':'100px'}}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myTasks.map((task, index)=>(
                                <tr key={task?._id || index}>
                                    <td style={{textAlign:'center'}}>{index + 1}</td>
                                    <td>{task.title}</td>
                                    <td>{task.description}</td>
                                    <td style={{textAlign:'center', color: task.priority == 0 ? 'var(--primary-color)' : 'var(--red)'}}>{task.priority == 0 ? 'Normal' : 'High'}</td>
                                    <td style={{textAlign:'center'}}>{task.deadline}</td>
                                    <td style={{textAlign:'center', color: task.status == 0 ? 'var(--text-dark)' : task.status == 1 ? 'var(--maroon)' : 'var(--secondary-color)'}}>{task.status == 0 ? 'Assigned' : task.status == 1 ? 'In-Progress' : 'Completed'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default MyTasks;
