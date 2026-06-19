import { Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";

type Shape={
    type:"rect",
    x:number;
    y:number;
    width:number;
    height:number;
}|{
    type:"circle";
    centerX:number;
    centerY:number;
    radius:number;
}|{
    type:"pencil";
    startX:number;
    startY:number;
    endX:number;
    endY:number;
}|{
    type:"cursor"
}
export class Game{
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private existingShapes: Shape[];
    private roomId: string;
    private clicked:boolean;
    private startX = 0;
    private startY = 0;
    private selectedTool:Tool = "circle";
    private previousX = 0;
    private previousY = 0;

    socket:WebSocket;

    constructor(canvas:HTMLCanvasElement, roomId: string,socket:WebSocket){
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.existingShapes = [];
        this.roomId = roomId;
        this.socket = socket;
        this.clicked = false;
        this.init();
        this.intiHandlers();
        this.initMouseHandlers();
        // this.updatePanning();
        // this.initPanning();

    }
    destroy(){
        this.canvas.removeEventListener("mousedown",this.mouseDownHandler)
        this.canvas.removeEventListener("mouseup",this.mouseUpHandler)
        this.canvas.removeEventListener("mousemove",this.mouseMoveHandler)
        // this.canvas.removeEventListener("mousedown",this.pmouseDownHandler)
        // this.canvas.removeEventListener("mousemove",this.updatePanning)
    }

    setTool(tool:"circle" | "pencil" | "rect" | "cursor"){
        this.selectedTool = tool;
    }

    async init(){
        this.existingShapes = await getExistingShapes(this.roomId);
        this.clearCanvas();

    }
    intiHandlers(){
        this.socket.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type == "chat") {
            const parsedShape = JSON.parse(message.message)
            this.existingShapes.push(parsedShape.shape)
            this.clearCanvas();
        }
    }
    }
    clearCanvas(){
        this.ctx.clearRect(0,0,this.canvas.width, this.canvas.height);
        this.ctx.fillStyle="rgba(0,0,0)"
        this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
        this.existingShapes.map((shape) =>{
            if(shape.type==="rect"){
                this.ctx.strokeStyle = "rgba(255,255,255)"
                this.ctx.strokeRect(shape.x,shape.y, shape.width,shape.height);
            }
            else if(shape.type === "circle"){
                this.ctx.beginPath();
                this.ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.closePath();
            }
            else if(shape.type === "pencil"){
                this.ctx.beginPath();
                this.ctx.moveTo(shape.startX,shape.startY);
                this.ctx.lineTo(shape.endX,shape.endY);
                this.ctx.stroke();
            }
            else if(shape.type === "cursor"){
                this.initPanning();
            }
        })
    }

    mouseDownHandler = (e) =>{
        this.clicked = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
    }
    mouseUpHandler= (e) =>{
        this.clicked = false
        const width = e.clientX - this.startX;
        const height = e.clientY - this.startY;
        //@ts-ignore
        const selectedTool = this.selectedTool;
        let shape: Shape | null = null;
        if(selectedTool === "rect"){
            shape ={
                //@ts-ignore
                type:"rect",
                x:this.startX,
                y: this.startY,
                height,
                width
            }

        } else if(selectedTool === "circle"){
            const radius = Math.max(width,height) /2;
            shape ={
                //@ts-ignore
                type:"circle",
                radius:radius,
                centerX: this.startX + radius ,
                centerY: this.startY + radius
            }
        }
        else if(selectedTool === "pencil"){
            const endX = e.clientX;
            const endY = e.clientY;
            shape={
                type:"pencil",
                startX:this.startX,
                startY:this.startY,
                endX,
                endY
            }
        }
        else if(selectedTool === "cursor"){
            this.initPanning(e);
        }
        if(!shape){
            return;
        }
        this.existingShapes.push(shape);
        this.socket.send(JSON.stringify({
            type:"chat",
            message: JSON.stringify({
                shape
            }),
            roomId:this.roomId
        }))

    }
    mouseMoveHandler = (e) =>{
        if(this.clicked) {
            const width = e.clientX - this.startX;
            const height = e.clientY - this.startY;
            this.clearCanvas();
            this.ctx.strokeStyle = "rgba(255,255,255)"
            const selectedTool = this.selectedTool;
            if(selectedTool === "rect"){
                this.ctx.strokeRect(this.startX, this.startY,width, height);
            }else if(selectedTool === "circle"){
                const radius = Math.max(width,height) /2;
                const centerX =this.startX + radius;
                const centerY = this.startY+ radius;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.closePath();
            }
            else if(selectedTool === "pencil"){
                const endX = e.clientX;
                const endY = e.clientY;
                this.ctx.beginPath();
                this.ctx.moveTo(this.startX,this.startY);
                this.ctx.lineTo(endX,endY);
                this.ctx.stroke();
            }
            else if(selectedTool === "cursor"){
                this.initPanning();
            }
        }
    }
    initMouseHandlers(e){
        this.canvas.addEventListener("mousedown",this.mouseDownHandler)
        this.canvas.addEventListener("mouseup",this.mouseUpHandler)
        this.canvas.addEventListener("mousemove",this.mouseMoveHandler)
    }
    updatePanning =(e) =>{
        const viewportTransform = {
            x: 0,
            y: 0,
            scale: 1
        }
        const localX = e.clientX;
        const localY = e.clientY;
        viewportTransform.x += localX - this.previousX;
        viewportTransform.y += localY - this.previousY;
        this.previousX = localX;
        this.previousY = localY;
        this.ctx.setTransform(1, 0, 0, 1, 0, 0)
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.ctx.setTransform(
            viewportTransform.scale,
            0,
            0,
            viewportTransform.scale,
            viewportTransform.x,
            viewportTransform.y
        )
    }
    pmouseDownHandler = (e)=>{
        this.previousX = e.clientX
        this.previousY = e.clientY
        this.canvas.addEventListener('mousemove', this.updatePanning)
    }
    pmouseUpHandler =(e) =>{
        this.clicked = false
        this.canvas.removeEventListener('mousemove', this.updatePanning)
    }
    // initPanning(e){
    //     this.canvas.addEventListener("mousedown",this.pmouseDownHandler)
    //     this.canvas.addEventListener("mousemove",this.updatePanning)
    // }
}
