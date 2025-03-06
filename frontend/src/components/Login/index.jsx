import { useState } from 'react';
import { loginUser } from '../../api/users';
import { registerUserInDb, loginUserFromDb } from '../../api/database';
import ThemeToggle from '../ThemeToggle';
import styles from './Login.module.css';

const Login = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [nextAvailableTime, setNextAvailableTime] = useState(null);
    const [hoursLeft, setHoursLeft] = useState(0);
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setNextAvailableTime(null);
        setHoursLeft(0);

        try {
            if (isRegistering) {
                // Register new user with direct database connection
                const userData = await registerUserInDb(username, password);

                // Store user data in localStorage
                localStorage.setItem('access_token', userData.access_token);
                localStorage.setItem('user_id', userData.user_id);
                localStorage.setItem('username', userData.username);
                localStorage.setItem('group_id', userData.group_id);
                localStorage.setItem('current_session', userData.current_session);

                // Log the registration
                console.log(`User registered: ${username}, Group: ${userData.group_id}, Session: ${userData.current_session}`);

                onLoginSuccess();
            } else {
                // Try direct database login first
                try {
                    const userData = await loginUserFromDb(username, password);

                    // Store user data in localStorage with real token from API response
                    localStorage.setItem('access_token', userData.access_token);
                    localStorage.setItem('user_id', userData.user_id);
                    localStorage.setItem('username', userData.username);
                    localStorage.setItem('group_id', userData.group_id);
                    localStorage.setItem('current_session', userData.current_session);

                    // Store next available time if present
                    if (userData.next_available_at) {
                        localStorage.setItem('next_available_at', userData.next_available_at);
                    }

                    // Log the login
                    console.log(`User logged in: ${username}, Group: ${userData.group_id}, Session: ${userData.current_session}`);

                    onLoginSuccess();
                } catch (dbError) {
                    console.warn('Direct DB login failed:', dbError);

                    // Check if it's a 403 error for time restriction
                    if (dbError.response && dbError.response.status === 403 && dbError.response.data.next_available_at) {
                        setNextAvailableTime(new Date(dbError.response.data.next_available_at));
                        setHoursLeft(dbError.response.data.hours_left || 24);
                        setError('You cannot login yet. Please wait 24 hours between sessions.');
                    } else {
                        // Fallback to API login if direct database fails
                        console.warn('Trying API login');
                        try {
                            await loginUser(username, password);
                            onLoginSuccess();
                        } catch (apiError) {
                            console.error('API login failed:', apiError);
                            setError('Invalid username or password');
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Login/Registration error:', err);

            // Check for 403 error with next_available_at
            if (err.response && err.response.status === 403 && err.response.data.next_available_at) {
                setNextAvailableTime(new Date(err.response.data.next_available_at));
                setHoursLeft(err.response.data.hours_left || 24);
                setError('You cannot login yet. Please wait 24 hours between sessions.');
            } else {
                setError(isRegistering ? 'Registration failed' : 'Invalid username or password');
            }
        } finally {
            setLoading(false);
        }
    };

    // Format next available time nicely
    const formatNextAvailable = () => {
        if (!nextAvailableTime) return '';

        return nextAvailableTime.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.kingPiece} aria-hidden="true"></div>
            <div className={styles.pawnPiece} aria-hidden="true"></div>
            <div className={styles.knightPiece} aria-hidden="true"></div>
            <div className={styles.queenPiece} aria-hidden="true"></div>
            <div className={styles.knightPiece2} aria-hidden="true"></div>
            <div className={styles.queenPiece2} aria-hidden="true"></div>
            <div className={styles.rookPiece} aria-hidden="true"></div>
            <div className={styles.rookPiece2} aria-hidden="true"></div>
            <div className={styles.rookPiece3} aria-hidden="true"></div>
            <div className={styles.appTitleContainer}>
                <h1 className={styles.appTitle}>Chess Research Project</h1>
                <div className={styles.themeToggleWrapper}>
                    <ThemeToggle />
                </div>
            </div>
            <form onSubmit={handleSubmit} className={styles.loginForm}>
                <h2>{isRegistering ? 'Register' : 'Login'}</h2>

                {error && (
                    <div className={styles.error}>
                        <p>{error}</p>
                        {nextAvailableTime && (
                            <div className={styles.timeRestriction}>
                                <p>You can login again in approximately {hoursLeft} hour{hoursLeft !== 1 ? 's' : ''}.</p>
                                <p>Next available: {formatNextAvailable()}</p>
                            </div>
                        )}
                    </div>
                )}

                <div className={styles.inputGroup}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={loading}
                    />
                </div>
                <div className={styles.inputGroup}>
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Processing...' : (
                        <>
                            <svg className={styles.chessIcon} viewBox="0 0 24 24" width="24" height="24">
                                <path d="M19,22H5V20H19V22M17,10H12V15H7V10H2L12,0L22,10H17M7,15H17V17H7V15Z" fill="white"/>
                            </svg>
                            {isRegistering ? 'Register' : 'Login'}
                        </>
                    )}
                </button>

                <div className={styles.switchModeContainer}>
                    <button
                        type="button"
                        onClick={() => {
                            setIsRegistering(!isRegistering);
                            setError('');
                            setNextAvailableTime(null);
                        }}
                        className={styles.switchModeButton}
                        disabled={loading}
                    >
                        {isRegistering ? 'Already have an account? Login' : 'New? Register'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Login;