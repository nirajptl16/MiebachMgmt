export interface JWTPayload{
    userId: string;
    email:string;
    role:string;
}

export interface BudgetSummary{
    forecast:number;
    actual:number;
    remaining:number;
    percentUsed:number;
} 

export interface UtilizationData{
    userId:string;
    userName:string;
    totalHours:number;
    roleName:string;
    forecastHours:number;
    actualHours:number;
    utilization:number;
}

export interface InvoiceLineItem{
    taskId:string;
    taskTitle:string;
    phaseName:string
    hours:number;
    hourlyRate:number;
    amount:number;
    userName?:string;
}

