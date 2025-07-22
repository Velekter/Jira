import React from 'react';
import type { Task } from '../../lib/tasks';
import './upcomingTasks.scss';
import { moveTaskToCurrent } from '../../lib/tasks';

interface Props {
  tasks: Task[];
  onOpenTaskModal: (task: Task) => void;
  statuses: string[];
}

const UpcomingTasks: React.FC<Props> = ({ tasks, onOpenTaskModal, statuses }) => {
  const now = Date.now();
  const upcomingTasks = tasks.filter(
    task => typeof task.deadline === 'number' && task.deadline > now
  );

  const handleMove = async (task: Task) => {
    if (!task.id) return;
    const firstStatus = statuses[0];
    await moveTaskToCurrent(task.id, firstStatus);

    window.dispatchEvent(
      new CustomEvent('task-save', {
        detail: { id: task.id, updatedTask: { status: firstStatus, deadline: null } },
      })
    );
  };

  if (upcomingTasks.length === 0) return <p>No upcoming tasks.</p>;

  return (
    <div className="upcoming-tasks">
      <h2>Upcoming Tasks</h2>
      <ul>
        {upcomingTasks.map(task => (
          <li key={task.id}>
            <div onClick={() => onOpenTaskModal(task)}>
              <span className="title">{task.title}</span>
              <span className="deadline">
                {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
              </span>
            </div>
            <button onClick={() => handleMove(task)}>Move to Current</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UpcomingTasks;
