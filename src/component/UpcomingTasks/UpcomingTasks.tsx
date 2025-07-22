import React from 'react';
import type { Task } from '../../lib/tasks';
import './upcomingTasks.scss';

interface Props {
  tasks: Task[];
  onOpenTaskModal: (task: Task) => void;
}

const UpcomingTasks: React.FC<Props> = ({ tasks, onOpenTaskModal }) => {
  const now = Date.now();
  const upcomingTasks = tasks.filter(
    (task) => typeof task.deadline === 'number' && task.deadline > now
  );

  if (upcomingTasks.length === 0) return <p>No upcoming tasks.</p>;

  return (
    <div className="upcoming-tasks">
      <h2>Upcoming Tasks</h2>
      <ul>
        {upcomingTasks.map(task => (
          <li key={task.id} onClick={() => onOpenTaskModal(task)}>
            <span className="title">{task.title}</span>
            <span className="deadline">
              {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UpcomingTasks;
