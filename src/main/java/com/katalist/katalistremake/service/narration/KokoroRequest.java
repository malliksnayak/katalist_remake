package com.katalist.katalistremake.service.narration;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class KokoroRequest {
    private String text;
    private String voice;
    private double speed;
    private String lang;
}
