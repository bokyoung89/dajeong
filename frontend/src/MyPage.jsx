import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { supabase } from './supabaseClient';

// Helper component for expandable content
const ExpandableCell = ({ content }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef(null);

  useLayoutEffect(() => {
    // Check for overflow when the component mounts or content changes
    if (contentRef.current) {
      const hasOverflow = contentRef.current.scrollWidth > contentRef.current.clientWidth;
      setIsOverflowing(hasOverflow);
    }
  }, [content]);

  return (
    <div>
      <p
        ref={contentRef}
        style={isExpanded ? styles.tdContentExpanded : styles.tdContentCollapsed}
      >
        {content}
      </p>
      {isOverflowing && (
        <button onClick={() => setIsExpanded(!isExpanded)} style={styles.expandButton}>
          {isExpanded ? '숨기기' : '더보기'}
        </button>
      )}
    </div>
  );
};

function MyPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [transcriptions, setTranscriptions] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'weekly', 'monthly', 'yearly'
  const [currentPage, setCurrentPage] = useState(1);
  const [count, setCount] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    if (!loading && !session) {
      navigate('/login');
    }
  }, [session, loading, navigate]);

  useEffect(() => {
    if (session) {
      const fetchTranscriptions = async () => {
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
          .from('transcriptions')
          .select('created_at, emotion, content', { count: 'exact' })
          .eq('user_id', session.user.id);

        if (filter !== 'all') {
          const now = new Date();
          let startDate;

          if (filter === 'weekly') {
            startDate = new Date(now.setDate(now.getDate() - 7));
          } else if (filter === 'monthly') {
            startDate = new Date(now.setMonth(now.getMonth() - 1));
          } else if (filter === 'yearly') {
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          }
          query = query.gte('created_at', startDate.toISOString());
        }

        const { data, error, count } = await query
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) {
          setFetchError('필사 내역을 가져올 수 없습니다.');
          setTranscriptions([]);
          console.error(error);
        } else {
          setTranscriptions(data);
          setCount(count);
          setFetchError(null);
        }
      };
      fetchTranscriptions();
    }
  }, [session, filter, currentPage]);

  // Reset page to 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert('로그아웃 중 오류가 발생했습니다: ' + error.message);
    } else {
      navigate('/');
    }
  };

  const totalPages = Math.ceil(count / pageSize);

  if (loading) {
    return <div style={styles.container}>로딩 중...</div>;
  }

  if (!session) {
    return null; // 로그인 페이지로 리디렉션되었으므로 아무것도 렌더링하지 않음
  }

  return (
    <div style={styles.container}>
      <div style={styles.buttonContainer}>
        <button onClick={() => navigate('/')} style={styles.homeButton}>
          홈으로 돌아가기
        </button>
        <button onClick={handleLogout} style={styles.button}>
          로그아웃
        </button>
      </div>

      <h2 style={styles.subTitle}>나의 필사 기록</h2>

      <div style={styles.filterContainer}>
        <button onClick={() => setFilter('all')} style={filter === 'all' ? styles.activeFilter : styles.filterButton}>전체</button>
        <button onClick={() => setFilter('weekly')} style={filter === 'weekly' ? styles.activeFilter : styles.filterButton}>주별</button>
        <button onClick={() => setFilter('monthly')} style={filter === 'monthly' ? styles.activeFilter : styles.filterButton}>월별</button>
        <button onClick={() => setFilter('yearly')} style={filter === 'yearly' ? styles.activeFilter : styles.filterButton}>연도별</button>
      </div>

      {fetchError && <p>{fetchError}</p>}
      <div style={styles.tableContainer}>
        {transcriptions.length > 0 ? (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{...styles.th, width: '15%'}}>날짜</th>
                  <th style={{...styles.th, width: '15%'}}>감정</th>
                  <th style={{...styles.th, width: '70%'}}>구절</th>
                </tr>
              </thead>
              <tbody>
                {transcriptions.map((item) => (
                  <tr key={item.created_at}>
                    <td style={styles.td}>{new Date(item.created_at).toLocaleDateString()}</td>
                    <td style={styles.td}>{item.emotion}</td>
                    <td style={{...styles.td, textAlign: 'left'}}>
                      <ExpandableCell content={item.content} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        ) : (
          <p style={{textAlign: 'center', marginTop: '20px'}}>해당 기간의 필사 기록이 없습니다.</p>
        )}
      </div>
      {totalPages > 1 && (
        <div style={styles.paginationContainer}>
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              style={currentPage === page ? styles.activePageButton : styles.pageButton}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#3e513c',
    color: '#f3dbb9',
    fontFamily: 'Arial, sans-serif',
    boxSizing: 'border-box',
    padding: '80px 20px 20px 20px',
  },
  buttonContainer: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    display: 'flex',
    gap: '10px',
  },
  button: {
    padding: '10px 20px',
    fontSize: '1em',
    cursor: 'pointer',
    backgroundColor: '#f3dbb9',
    color: '#3e513c',
    border: 'none',
    borderRadius: '8px',
    transition: 'background-color 0.3s ease',
  },
  homeButton: {
    padding: '10px 20px',
    fontSize: '1em',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: '#f3dbb9',
    border: '1px solid #f3dbb9',
    borderRadius: '8px',
    transition: 'background-color 0.3s ease',
  },
  subTitle: {
    fontSize: '1.8em',
    marginTop: '20px',
    marginBottom: '10px',
    borderBottom: '1px solid #f3dbb9',
    paddingBottom: '10px',
    flexShrink: 0,
  },
  filterContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  filterButton: {
    padding: '8px 16px',
    fontSize: '0.9em',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: '#f3dbb9',
    border: '1px solid #f3dbb9',
    borderRadius: '20px',
    transition: 'all 0.3s ease',
  },
  activeFilter: {
    padding: '8px 16px',
    fontSize: '0.9em',
    cursor: 'pointer',
    backgroundColor: '#f3dbb9',
    color: '#3e513c',
    border: '1px solid #f3dbb9',
    borderRadius: '20px',
    transition: 'all 0.3s ease',
  },
  tableContainer: {
    width: '100%',
    maxWidth: '900px',
    flexGrow: 1,
    overflowY: 'auto',
    border: '1px solid #f3dbb9',
    borderRadius: '8px',
    minHeight: '200px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    color: '#f3dbb9',
    tableLayout: 'fixed', // Crucial for stable column widths
  },
  th: {
    backgroundColor: 'rgba(243, 219, 185, 0.2)',
    padding: '12px',
    textAlign: 'center',
    borderBottom: '1px solid #f3dbb9',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid rgba(243, 219, 185, 0.2)',
    textAlign: 'center',
    verticalAlign: 'middle',
  },
  tdContentCollapsed: {
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  tdContentExpanded: {
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word', // Use break-word for better word wrapping
  },
  expandButton: {
    background: 'none',
    border: 'none',
    color: '#a0a0a0', // Lighter color for less emphasis
    textDecoration: 'underline',
    cursor: 'pointer',
    padding: '4px 0 0 0',
    fontSize: '0.85em',
  },
  paginationContainer: {
    display: 'flex',
    gap: '8px',
    marginTop: '20px',
  },
  pageButton: {
    padding: '8px 12px',
    fontSize: '0.9em',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: '#f3dbb9',
    border: '1px solid #f3dbb9',
    borderRadius: '5px',
    transition: 'all 0.3s ease',
  },
  activePageButton: {
    padding: '8px 12px',
    fontSize: '0.9em',
    cursor: 'pointer',
    backgroundColor: '#f3dbb9',
    color: '#3e513c',
    border: '1px solid #f3dbb9',
    borderRadius: '5px',
    transition: 'all 0.3s ease',
  },
};

export default MyPage;


