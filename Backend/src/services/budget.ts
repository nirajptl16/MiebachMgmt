import { PrismaClient } from "@prisma/client";
import { BudgetSummary } from "../types/types";

const prisma = new PrismaClient();

export class BudgetService {

    //Calculate budget for whole project
    static async getProjectBudget(projectId:string):Promise<BudgetSummary>{
        const project = await prisma.project.findUnique({
            where:{id:projectId},
            include:{staffing:true,
                phases:{
                    include:{
                        tasks:{
                            include:{
                                timeEntries:true,
                                assignments:true
                            },
                        },
                    },
                },
            },
        });

if(!project){
    throw new Error('Project not found');
}

//Forecast from staffing
const forecast = project.staffing.reduce(
    (sum, s) => sum + Number(s.forecastHours) * Number(s.hourlyRate),
    0
);

//Actual project budget from time entries

let actual = 0;
for (const phase of project.phases){
    for(const task of phase.tasks){
        task.timeEntries.forEach(entry=>{
            const assignment = task.assignments.find(a=>a.userId===entry.userId);
            const rate = assignment? Number(assignment.hourlyRate) :0;
            actual += Number(entry.hours) * rate;
        });
    }
}

const remaining = forecast-actual;
const percentUsed = forecast > 0? (actual/forecast)*100 :0;

return{
    forecast,
    actual,
    remaining,
    percentUsed: Math.round(percentUsed*100)/100,
};
    
}    

//Calculate budget for specific phase
static async getPhaseBudget(phaseId:string):Promise<BudgetSummary>{
    const phase = await prisma.projectPhase.findUnique({
        where:{id:phaseId}, 
        include:{
            tasks:{
                include:{
                    timeEntries:true,
                    assignments:true,
                },
            },
        },
    });

    if(!phase){
        throw new Error('Phase not found');
    }

let forecast = 0;
let actual = 0;

for (const task of phase.tasks){
    forecast += Number(task.budget);

    task.timeEntries.forEach(entry=>{
        const assignment = task.assignments.find(a=>a.userId===entry.userId);
        const rate = assignment? Number(assignment.hourlyRate) :0;
        actual += Number(entry.hours) * rate;
    });
}
const remaining = forecast - actual;
const percentUsed = forecast > 0 ? (actual / forecast) * 100 : 0;

return {
    forecast,
    actual,
    remaining,
    percentUsed: Math.round(percentUsed * 100) / 100,
};
}
// Calulate budget for specific task
static async getTaskBudget(taskId:string):Promise<BudgetSummary>{
    const task = await prisma.task.findUnique({
        where:{id:taskId},
        include:{
            timeEntries:true,
            assignments:true,
        },
    });
    if (!task){
        throw new Error('Task not found');
    }
    const forecast = Number(task.budget);
    const actual = task.timeEntries.reduce((sum, entry)=>{
        const assignment = task.assignments.find(a=>a.userId===entry.userId);
        const rate = assignment? Number(assignment.hourlyRate) :0;
        return sum + Number(entry.hours) * rate;
    },0);
    const remaining = forecast - actual;
    const percentUsed = forecast > 0 ? (actual / forecast) * 100 : 0;
    return {
        forecast,
        actual,
        remaining,
        percentUsed: Math.round(percentUsed * 100) / 100,
    };
}
}
