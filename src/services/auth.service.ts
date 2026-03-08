import prisma from "../database/prisma.js";
import bcrypt from  "bcrypt";
export const CreateUser = async(email:string,password:string,username:string)=>{
    const userexist= await prisma.user.findUnique({
        where:{email}
    })
    if(userexist){
        throw new Error("Email already in use");
    }

    const hashedpassword= await bcrypt.hash(password,12);
    const user=await prisma.user.create({
        data:{
            email,
            password:hashedpassword,
            name:username
        }
    })
    return user;
    }
export const LoginUser = async(email:string,password:string)=>{
     const user= await prisma.user.findUnique({
        where:{email}
    })
    if(!user){
        throw new Error("Invalid Email or Password");
    }
    const hashedpass=user.password;
    const iscorrectpass= await bcrypt.compare(password,hashedpass);
    if(!iscorrectpass){
        throw new Error("Invalid Email or Password");
    }
    return {
        id:user.id,
        email:user.email,
        role:user.role
    };
}
