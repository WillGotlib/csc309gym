import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';

import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import {createTheme, ThemeProvider} from '@mui/material/styles';


// From https://github.com/mui/material-ui/tree/v5.10.16/docs/data/material/getting-started/templates/sign-in

export default function Register() {
    const [feedback, setFeedback] = useState({});
    const navigate = useNavigate();

    const theme = createTheme();

    const handleSubmit = (event) => {
        event.preventDefault();
        const newUsername = event.currentTarget.querySelector('#username').value;
        const newEmail = event.currentTarget.querySelector('#email').value;
        const newPassword1 = event.currentTarget.querySelector('#password1').value;
        const newPassword2 = event.currentTarget.querySelector('#password2').value;
        console.log('new username: ', newUsername);
        console.log('new email: ', newEmail);
        console.log('new password1: ', newPassword1);
        console.log('new password2: ', newPassword2);

        const formDataObject = {
            'username': newUsername,
            'email': newEmail,
            'password': newPassword1,
            'password2': newPassword2,
        }

        console.log('Resister formDataObject:', formDataObject);
        var res_status = 400;
        fetch(`http://localhost:8000/accounts/register/`, {
            method: 'POST',
            body: JSON.stringify(formDataObject),
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(async (res) => {
            const json = await res.json();
            if (res.ok) {
                navigate("/login");
            } else {
                console.error("Error: Incorrect input or some other error." +
                    "\nSetting Feedback." +
                    "\nJSON: ", json);
                setFeedback(json);
            }
        }).catch((error) => {
            console.error('Error:', error);
        });
    };


    return (
        <ThemeProvider theme={theme}>
            <Container component="main" maxWidth="xs">
                <CssBaseline/>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Avatar sx={{m: 1, bgcolor: 'secondary.main'}}>
                        <LockOutlinedIcon/>
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        Sign up
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} sx={{mt: 3}}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    required
                                    fullWidth
                                    id="username"
                                    label="Username"
                                    name="username"
                                    autoComplete="username"
                                />
                                {feedback.username !== undefined && (<div className='text-center'>{feedback.username[0]}</div>)}
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    id="email"
                                    label="Email Address"
                                    name="email"
                                    autoComplete="email"
                                />
                                {feedback.email !== undefined && (<div className='text-center'>{feedback.email[0]}</div>)}
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    required
                                    fullWidth
                                    name="password1"
                                    label="Password"
                                    type="password"
                                    id="password1"
                                    autoComplete="new-password1"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    required
                                    fullWidth
                                    name="password2"
                                    label="Confirm Password"
                                    type="password"
                                    id="password2"
                                    autoComplete="new-password2"
                                />
                                {feedback.password !== undefined && (<div className='text-center'>{feedback.password}</div>)}
                            </Grid>
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={<Checkbox value="allowExtraEmails" color="primary"/>}
                                    label="I want to receive inspiration, marketing promotions and updates via email."
                                />
                                <div className='text-center'>
                                    {/* {feedback} */}
                                </div>
                            </Grid>
                        </Grid>
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{mt: 3, mb: 2}}
                        >
                            Sign Up
                        </Button>
                    </Box>
                </Box>
            </Container>
        </ThemeProvider>
    );
}