import React, { useEffect, useState } from 'react';
import './MyTasks.css';
import { apibaseurl, callApi, imgurl } from '../lib';

const MyTasks = ({logout}) => {
    const [myTasks, setMyTasks] = useState(null);

    function fetchMyTasks() {
        callApi(
            "GET",
            apibaseurl + "/taskservice/getmytasks/1/50",
            null,
            null,
            handleTasks,
            localStorage.getItem("token")
        );
    }

    function handleTasks(res) {
        if(res.code !== 200) {
            setMyTasks([]);
            return;
        }

        setMyTasks(res.tasks || []);
    }

    useEffect(() => {
        const storedtoken = localStorage.getItem("token");

        if(storedtoken === undefined || storedtoken === "")
            return logout();

        fetchMyTasks();
    }, []);

    return (
        <div className='mtasks'>
            <div className='mtasks-header'>
                <label>My Tasks</label>
                {myTasks && (
                    <span className='mtasks-count'>
                        {myTasks.length} assigned to you
                    </span>
                )}
            </div>

            <div className='mtasks-content'>
                {myTasks === null ? (
                    <div className='mtasks-loading'>
                        Loading your tasks...
                    </div>
                ) : myTasks.length === 0 ? (
                    <div className='mtasks-empty'>
                        <img src={imgurl + "mytask.png"} alt='' />
                        <label>No tasks assigned to you yet.</label>
                        <span>
                            Tasks shared with your account will appear here.
                        </span>
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
                            {myTasks.map((task, index) => (
                                <tr key={task?._id || index}>
                                    <td style={{textAlign:'center'}}>
                                        {index + 1}
                                    </td>

                                    <td>{task.title}</td>

                                    <td>{task.description}</td>

                                    <td
                                        style={{
                                            textAlign:'center',
                                            color: task.priority == 0
                                                ? 'var(--primary-color)'
                                                : 'var(--red)'
                                        }}
                                    >
                                        {task.priority == 0 ? 'Normal' : 'High'}
                                    </td>

                                    <td style={{textAlign:'center'}}>
                                        {task.deadline}
                                    </td>

                                    <td
                                        style={{
                                            textAlign:'center',
                                            color:
                                                task.status == 0
                                                    ? 'var(--text-dark)'
                                                    : task.status == 1
                                                        ? 'var(--maroon)'
                                                        : 'var(--secondary-color)'
                                        }}
                                    >
                                        {task.status == 0
                                            ? 'Assigned'
                                            : task.status == 1
                                                ? 'In-Progress'
                                                : 'Completed'}
                                    </td>
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
