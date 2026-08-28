import express from "express";
import {
    scrapeRequest,
    scrapeRentaHouse,
    ingestProperties
} from "../controllers/scraperController.js";

import {
    rentALinks
} from '../controllers/rentaHouse.js'

import {
    getRemaxLinks,
    scrapeRemax
} from '../controllers/remax.js'

import { requireScraperKey } from "../middleware/auth.mjs";

const router = express.Router();

router.get("/", async (req, res) => {
    res.send({
        message: "activo"
    })
})

router.get("/ping", async (req, res) => {
    res.send({
        message: `
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
                                                                            i~.
                                                                            

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
                                                                            i~.
                                                                            

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
                                                                            i~.
                                                                            
                                                                            `
    });
});

// Endpoint del contrato con Habitas (§6.1)
router.post("/scrape", requireScraperKey, scrapeRequest);

// Endpoint propio: ejecutar scraping de RentaHouse con N propiedaes
router.post("/scrape/rentahouse", requireScraperKey, scrapeRentaHouse);

router.post('/scrape/remax', requireScraperKey, scrapeRemax)

// Enpoint propio para recolectar links de las propiedades
router.post("/scrape/rentALinks", requireScraperKey, rentALinks);

router.post('/scrape/remaxLinks', requireScraperKey, getRemaxLinks)

// Endpoint de consulta: Habitas consume propiedades ya guardadas en la DB
router.post("/ingest", requireScraperKey, ingestProperties);

export {
    router as scrapRoutes
};