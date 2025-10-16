import axios from 'axios';

//Axios instance base api for all calls 
export const apiClient = axios.create({
    baseURL: 'http://localhost:5000/api', // ← Your backend URL
    headers: { 'Content-Type': 'application/json',
    },
});

//attach token to every request for protected routes such as MANAGER routes
apiClient.interceptors.request.use((config)=>{
    const token = localStorage.getItem('token');
    if(token){
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
})

//Handle 401 errors
apiClient.interceptors.response.use(
    response => response,
    (error) => {
        if(error.response?.status === 401){
            localStorage.removeItem('token');
            window.location.href = '/login'; //redirect to login page
        }
        return Promise.reject(error);
    }   
);


