package com.katalist.katalistremake.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Controller to handle SPA routing.
 * Forwards frontend routes to index.html so Next.js can handle client-side routing.
 */
@Controller
public class WebController {

    @RequestMapping(value = { "/audio", "/video" })
    public String forward() {
        return "forward:/index.html";
    }
}
