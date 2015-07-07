define(['text!templates/credits.html',
    'text!templates/overlay.html',
    'text!templates/popup.html',
    'text!templates/popup_simple.html',
    'text!templates/sql/click_feature.txt',
    'text!templates/sql/click_feature_winner.txt',
    'text!templates/sql/permalink.txt',
    'text!templates/sql/draw_selection1.txt',
    'text!templates/sql/draw_winner_selection2.txt',
    'text!templates/sql/draw_selection2.txt',
    'text!templates/sql/d3_geom.txt',
    'text!templates/sql/d3_winner_query.txt',
    'text!templates/sql/d3_diff_query.txt'], 
    function(credits, overlay, popup, popup_simple, 
             click_feature, click_feature_winner, permalink_sql, draw1_sql, 
             draw2_winner_sql, draw2_sql, d3_geom_sql, d3_winner_sql, 
             d3_diff_sql) {
        return {
            credits: credits,
            overlay: overlay,
            popup: popup,
            popup_simple: popup_simple,
            click_feature_sql: click_feature,
            click_feature_winner_sql: click_feature_winner,
            permalink_sql: permalink_sql,
            draw1_sql: draw1_sql,
            draw2_winner_sql: draw2_winner_sql,
            draw2_sql: draw2_sql,
            d3_geom_sql: d3_geom_sql,
            d3_winner_sql: d3_winner_sql,
            d3_diff_sql: d3_diff_sql
        };
});