import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const DebugFetch = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Starting fetch...');
        const { data: users, error: err } = await supabase
          .from('users')
          .select('*');
        
        console.log('Fetch result:', { users, err });
        
        if (err) {
          setError(err.message);
        } else {
          setData(users);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h2>Users in Database: {data?.length || 0}</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default DebugFetch;