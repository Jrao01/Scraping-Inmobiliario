import dotenv from "dotenv";
dotenv.config();
import express from "express";

import {
    scrapRoutes
} from "./routes/Routes.js";
import { syncDatabase } from "./models/index.js";
import { startCron } from "./services/cronService.js";
import { collectAndSaveLinks } from './services/rentaHouseLinks.js';
import { saveScrapedProperties } from './services/scraperRepository.js';
const app = express();
const port = process.env.PORT || 3000;

const DEFAULT_PAGES = parseInt(process.env.DEFAULT_PAGES, 10) || 5;

(async () => {
    try {
        // Sincronizar DB (sin alter para evitar errores en SQLite)
        await syncDatabase();

        //const links = await collectAndSaveLinks(DEFAULT_PAGES,500);
        //console.log('Links recolectados y guardados.');
    } catch (err) {
        console.error('Error en primera ejecución:', err.message);
    }
})();

startCron();


app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

app.use("/", scrapRoutes)

app.use(function (err, req, res, next) {
    console.error("Error:", err);

    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
    res.json({
        error: res.locals.message
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('.env', process.env.CHROME_PATH, )
    console.log("servicio activo en la pista")
    console.log("esperando solicitud de recoleccion  de datos....")
    console.log(`
                                                                            I☻☻                                                                            
                                                                         .@◙○░♣◙☻.                                                                         
                                                                        >○◙█   █◙◙M                                                                        
                                                                       @◙▓: ~█@ :▓◙♠.                                                                      
                                                                     1♣○% ;◘◙○◙◙@ i◘◘*                                                                     
                                                                    l♣◙  W◙◘   •◙&  ◘◙~                                                                    
                                                          ,|!!!!!|. ~◙# !○♣     ☺◙!     I|!!!!|1                                                           
                                                     +W☺◙◙◙○○♦&***, ~◙1 !◙█     #◙! ,*♥◙◙♦W#▒♣○◙◙◙○$W!                                                     
                                                    #○○II,          ~○♠ ,$◙☺   ☺◙$, ♠◙#;        .II<○○W                                                    
                                                     ☺○~ 1◘◙◙○○◘○◙◙  &○•   ◘◘○○◘  ▓◙♥   ◙◙○◘○○◙◙◙▒  ○☺                                                     
                                                     █◙░ #○☻     i♣○& ♥○@      :>○◙░  $◙☻,     ☻○& ░◙▒                                                     
                                                      ○♣! ◘◘*      ◙$ <◙▓ %◙◙◙◙◙♣*;   $◙      >◘◘ l♣◙                                                      
                                                      ;◙☻i ○○*   .♣○W ♥◙▓         W◘# $◙▓    l♠○  &◙l                                                      
                                                       l◙○. >○◙◙◙○○  %◙•           •◘<  ○◙◙◙◙○>  |◙♣                                                       
                                                        ~•◙+i       ~○☺             ♦◙Ml        .◙%,                                                       
                                                          #○◙○▓MMMM>        JRAO      !▒○◙◙◙•▒M#:                                                           
                                                            :lllll▒○○♥;             .=1  tlll|▒◙♠W                                                         
                                                       ,%◙.   ♠○♥I  ,$◙♠           ;◙◙~   +♥*   ○◙M                                                        
                                                       %◙| I◙◙☺░░☻○♠i ☻◙▓         1◘♣t;♠◙♠░░☺◙○l ~◙%                                                       
                                                      >◙@,.◙♣l    !◙$  M+  #####  ▓◙▒ $◙*    1☺◙  W◙>                                                      
                                                      ◙♥i ◘◙&     :◙$  .$♠◙○&|&○| ▓◙# $◙.     +♠◘ i♥◙                                                      
                                                     ░◙░ ▓◙○░i  .█○♣  =◙◙*         •♥  ♣○@     ☻○~ ░◙░                                                     
                                                    ,☻○    ☺☺☺☺☺☺☺I ,$◙♥ ;♥◙•☺♠◙♥; !◙█, :☺☺☻☻☺☺☺    ○☺                                                     
                                                    |♣◙◙♥M*<i    .<M◙○@ l♠○:    ◙♥t ☻◙~       .=*#☺◙◙☺                                                     
                                                       l|!$○◙◙◙◙◙◙◙♣l:  !◙l     &◙! W◙~ ;○◙◙◙◙◙○○=!t                                                       
                                                                    +•1 !◙○     ◙░; ○○~                                                                    
                                                                    ;▒◙▓ =•○+,☺◙♣I •○&                                                                     
                                                                      ▒◙☻i &◙◙◙& t♥◙*                                                                      
                                                                       ~◙♥i :!: ░◙○!                                                                       
                                                                         %◙♠  ▓◙◙&                                                                         
                                                                          =♦◙◙◙☻                                                                           
                                                                            i~.`)
});