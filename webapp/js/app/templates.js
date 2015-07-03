define(['text!templates/credits.html',
    'text!templates/overlay.html',
    'text!templates/popup.html',
    'text!templates/popup_error.html',
    'text!templates/feature_click.txt',
    'text!templates/permalink.txt',
    'text!templates/draw_selection1.txt',
    'text!templates/draw_selection2.txt',
    'text!templates/d3_winner_query.txt',
    'text!templates/d3_diff_query.txt'], 
    function(credits, overlay, popup, popup_error, 
             feature_click_sql, permalink_sql, draw1_sql, draw2_sql,
             d3_winner_sql, d3_diff_sql) {
        return {
            credits: credits,
            overlay: overlay,
            popup: popup,
            popup_error: popup_error,
            feature_click_sql: feature_click_sql,
            permalink_sql: permalink_sql,
            draw1_sql: draw1_sql,
            draw2_sql: draw2_sql,
            d3_winner_sql: d3_winner_sql,
            d3_diff_sql: d3_diff_sql
        };
});