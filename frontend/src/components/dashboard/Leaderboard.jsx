import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Trophy, Medal, Star, TrendingUp, User } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

const Leaderboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { onlineUsers } = useSocket();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get('/users/performance');
        setData(res.data.slice(0, 5)); // Top 5
      } catch (error) {
        console.error('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) return <div className="h-64 bg-secondary/50 rounded-3xl animate-pulse"></div>;

  return (
    <div className="glass-panel p-6 rounded-3xl border border-border-color shadow-xl bg-secondary overflow-hidden relative group">
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl group-hover:bg-yellow-500/10 transition-colors"></div>
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="text-xl font-bold text-text-primary flex items-center">
          <Trophy className="mr-3 text-yellow-500" size={24} />
          Top Performers
        </h3>
        <TrendingUp size={20} className="text-text-secondary opacity-30" />
      </div>

      <div className="space-y-4 relative z-10">
        {data.map((player, index) => (
          <div 
            key={player._id} 
            className={`flex items-center p-3 rounded-2xl border transition-all hover:-translate-y-0.5 ${
              index === 0 ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-primary/5 border-border-color/50'
            }`}
          >
            <div className="flex items-center justify-center w-8 h-8 mr-4">
              {index === 0 ? (
                <Trophy size={20} className="text-yellow-500" />
              ) : index === 1 ? (
                <Medal size={20} className="text-slate-400" />
              ) : index === 2 ? (
                <Medal size={20} className="text-orange-400" />
              ) : (
                <span className="text-sm font-bold text-text-secondary">#{index + 1}</span>
              )}
            </div>

            <div className="relative mr-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-500 to-primary-300 flex items-center justify-center text-white font-bold shadow-md">
                {player.name.charAt(0)}
              </div>
              {onlineUsers.includes(player._id) && (
                <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-secondary rounded-full shadow-sm"></span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-text-primary truncate">{player.name}</h4>
              <div className="flex items-center gap-3 text-[10px] text-text-secondary font-medium">
                <span className="flex items-center"><Star size={10} className="mr-1 text-yellow-500" /> {player.avgRating}</span>
                <span className="flex items-center font-bold text-primary-600 dark:text-primary-400">{player.completedTasks} Completed</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-black text-text-primary">{player.score}</div>
              <div className="text-[8px] font-bold text-text-secondary uppercase tracking-tighter">PTS</div>
            </div>
          </div>
        ))}

        {data.length === 0 && (
          <div className="py-10 text-center text-text-secondary opacity-50 italic">
            No rankings yet
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
