
export const UserNameRegex = /^[a-zA-Z][a-zA-Z\d]+$/;

export const PasswordRegex = 
/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?+_#-)=(])[A-Za-z\d@$!%*?&]/;

export const ForbidenRegex = /^[^ '"`\\/<>&]+$/;