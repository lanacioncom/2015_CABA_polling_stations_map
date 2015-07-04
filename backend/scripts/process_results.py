# coding: utf-8
import dataset
import csv
import os
# For simulation of results
import random
from default_settings import DB_RESULTS_URL

db = None
dir = os.path.dirname(__file__)
CABA_DATADICT_PATH = os.path.join(dir, '../data/caba/auxiliares')
CABA_RESULTS_PATH = os.path.join(dir, '../data/caba/resultados')
PASO_DATADICT_PATH = os.path.join(dir, '../data/paso/auxiliares')
PASO_RESULTS_PATH = os.path.join(dir, '../data/paso/resultados')
GEO_DATADICT_PATH = os.path.join(dir, '../data/geo')
POLLING_STATIONS_DATA_FILE = 'establecimientos_geo.csv'
POLLING_TABLES_DATA_FILE = 'mesas_final.csv'
CIRCUITS_DATA_FILE = 'circuitos.csv'
LISTS_DATA_FILE = 'listas_final.csv'
PARTIES_DATA_FILE = 'partidos_final.csv'
RESULTS_DATA_FILE = 'resultados_mesa.csv'

SCHEMA_POLLING_STATION_NUMERIC = {
    "id_establecimiento": "id_establecimiento",
    "id_comuna": "id_comuna",
    "ciudadanos_habilitados": "electores"
}

SCHEMA_POLLING_TABLE_NUMERIC = {
    "id_mesa": "id_mesa",
    "id_establecimiento": "id_establecimiento",
    "id_circuito": "id_circuito",
    "ciudadanos_habilitados": "electores",
    "id_barrio": "id_barrio",
    "id_comuna": "id_comuna"
}

SCHEMA_PASO_LISTS_NUMERIC = {
    "especial": "especial"
}

SCHEMA_PASO_PARTIES_NUMERIC = {
    "especial": "especial"
}

SCHEMA_CABA_LISTS_NUMERIC = {
    "especial": "especial"
}

SCHEMA_RESULTS_NUMERIC = {
    "id_mesa": "id_mesa",
    "cantidad_votantes": "electores",
    "sobres_utilizados": "votantes",
    "JEF": "votos",
    "LEG": "votos_leg",
    "COM": "votos_com"
}

SPECIAL_PARTIES = {
    "BLC": 0,
    "NUL": 1,
    "IMP": 1,
    "REC": 1,
    "TEC": 1
}


def randomized_int_by_perc(value=None, change=1):
    '''randomized an integer by a percentage
        if number is too low try absolute values
        and return always positive result'''
    perc = int(value/100)
    if perc:
        offset = random.randint(-(change * perc), change * perc)
    else:
        offset = random.randint(-5, 5)
    result = 0 if (value + offset < 0) else value + offset
    return result


def connect_dataset():
    '''DB connection setup'''
    return dataset.connect(DB_RESULTS_URL)


def recreateDB():
    ''' Clears the DB to make the script idempotent '''
    for t in db.tables:
        print t
        db.get_table(t).drop()


def import_poll_stations(fname):
    ''' import geolocated polling stations'''
    t = db.create_table('establecimientos',
                        primary_id='id_establecimiento',
                        primary_type='Integer')
    f = open(fname, 'r')
    fields = f.readline().replace("\"", "").strip().split(',')
    c = csv.DictReader(f, fields)
    results = []
    for row in c:
        t_results = {}
        for k, v in row.iteritems():
            if k in SCHEMA_POLLING_STATION_NUMERIC.keys():
                kt = SCHEMA_POLLING_STATION_NUMERIC[k]
                t_results[kt] = int(v) if v else None
            if k not in SCHEMA_POLLING_STATION_NUMERIC.keys():
                if k == "geom":
                    t_results[k] = v
                else:
                    t_results[k] = v.decode('utf-8')
        results.append(t_results)
    t.insert_many(results)


def import_poll_tables(fname):
    ''' import polling tables CSV '''
    t = db.create_table('mesas',
                        primary_id='id_mesa',
                        primary_type='Integer')
    f = open(fname, 'r')
    fields = f.readline().replace("\"", "").strip().split(',')
    c = csv.DictReader(f, fields)
    results = []
    for row in c:
        t_results = {}
        for k, v in row.iteritems():
            if k in SCHEMA_POLLING_TABLE_NUMERIC.keys():
                kt = SCHEMA_POLLING_TABLE_NUMERIC[k]
                t_results[kt] = int(v) if v else None
            if k not in SCHEMA_POLLING_TABLE_NUMERIC.keys():
                t_results[k] = v.decode('utf-8')
        results.append(t_results)
    t.insert_many(results, chunk_size=1000)


def paso_import_lists(fname):
    ''' import lists CSV '''
    t = db.create_table('listas_paso',
                        primary_id='id_lista',
                        primary_type='String(3)')
    f = open(fname, 'r')
    fields = f.readline().replace("\"", "").strip().split(',')
    c = csv.DictReader(f, fields)
    results = []
    for row in c:
        t_results = {}
        for k, v in row.iteritems():
            if k in SCHEMA_PASO_LISTS_NUMERIC.keys():
                kt = SCHEMA_PASO_LISTS_NUMERIC[k]
                t_results[kt] = int(v) if v else None
            if k not in SCHEMA_PASO_LISTS_NUMERIC.keys():
                t_results[k] = v.decode('utf-8')
        results.append(t_results)
    t.insert_many(results)


def paso_import_parties(fname):
    ''' import political parties CSV '''
    t = db.create_table('partidos_paso',
                        primary_id='id_partido',
                        primary_type='String(3)')
    f = open(fname, 'r')
    fields = f.readline().replace("\"", "").strip().split(',')
    c = csv.DictReader(f, fields)
    results = []
    for row in c:
        t_results = {}
        for k, v in row.iteritems():
            if k in SCHEMA_PASO_PARTIES_NUMERIC.keys():
                kt = SCHEMA_PASO_PARTIES_NUMERIC[k]
                t_results[kt] = int(v) if v else None
            if k not in SCHEMA_PASO_PARTIES_NUMERIC.keys():
                t_results[k] = v.decode('utf-8')
        results.append(t_results)
    t.insert_many(results)


def paso_import_results(fname):
    ''' import results by polling table CSV '''
    t = db['resultados_paso']
    f = open(fname, 'r')
    fields = f.readline().replace("\"", "").strip().split(',')
    c = csv.DictReader(f, fields)
    results = []
    for row in c:
        t_results = {}
        for k, v in row.iteritems():
            if k in SCHEMA_RESULTS_NUMERIC.keys():
                kt = SCHEMA_RESULTS_NUMERIC[k]
                t_results[kt] = int(v) if v else None
            if k not in SCHEMA_RESULTS_NUMERIC.keys():
                t_results[k] = v.decode('utf-8')
        results.append(t_results)
    t.insert_many(results, chunk_size=50000)


def paso_results_by_poll_station_party():
    ''' aggregate results by polling station and
        political party'''
    tmp = []
    q = '''
        SELECT m.id_establecimiento, p.id_partido, SUM(r.votos) as votos
        FROM resultados_paso r, listas_paso l, partidos_paso p, mesas m
        WHERE r.nro_lista = l.nro_lista
        AND l.id_partido = p.id_partido
        AND m.id_mesa = r.id_mesa
        GROUP BY m.id_establecimiento, p.id_partido;
        '''
    for p in db.query(q):
        p['votos'] = int(p['votos'])
        tmp.append(p)
    cache_table = db['votos_establecimiento_paso']
    cache_table.insert_many(tmp, chunk_size=1000)


def paso_classify_votes_by_poll_station():
    ''' classify votes by polling station '''
    tmp = []
    q = '''
        SELECT id_establecimiento,
            SUM(CASE WHEN id_partido = 'BLC'
                THEN votos else 0 end) as blancos,
            SUM(CASE WHEN id_partido not in ('NUL', 'REC', 'IMP')
                THEN votos else 0 end) as validos,
            SUM(CASE WHEN id_partido not in ('BLC', 'NUL', 'REC', 'IMP')
                THEN votos else 0 end) as positivos,
            SUM(CASE WHEN id_partido in ('NUL', 'REC', 'IMP')
                THEN votos else 0 end) as invalidos
            FROM votos_establecimiento_paso
            GROUP BY id_establecimiento
        '''

    for p in db.query(q):
        p['id_establecimiento'] = int(p['id_establecimiento'])
        p['blancos'] = int(p['blancos'])
        p['validos'] = int(p['validos'])
        p['positivos'] = int(p['positivos'])
        p['invalidos'] = int(p['invalidos'])
        tmp.append(p)
    votos_est = db['totales_establecimiento_paso']
    votos_est.insert_many(tmp)

def paso_winner_cache_table():
    q = '''
        WITH %(winner)s AS (SELECT id_establecimiento, id_partido, votos,
        row_number() over(partition by id_establecimiento
                          ORDER BY votos DESC) as rank,
        (votos - lead(votos,1,0) over(partition by id_establecimiento
                                     ORDER BY votos DESC)) as margin_victory
        FROM %(table_votes)s
        ORDER BY id_establecimiento, rank)
        SELECT e.id_establecimiento as id_establecimiento,
               e.id_comuna, e.geom,
               e.domicilio, e.descripcion,
               e.electores,
               t.positivos, sqrt(t.positivos) as sqrt_positivos,
               (t.validos + t.invalidos) as votantes,
               w.id_partido, w.votos, w.margin_victory
        FROM %(table_polling)s e, %(winner)s w, %(table_totals)s t
        WHERE e.id_establecimiento = w.id_establecimiento
        AND e.id_establecimiento = w.id_establecimiento
        AND e.id_establecimiento = t.id_establecimiento
        AND w.rank = 1;
        ''' % {'table_polling': 'establecimientos',
               'table_votes': 'votos_establecimiento_paso',
               'table_totals': 'totales_establecimiento_paso',
               'winner': 'winner'}

    results = db.query(q)
    cache_table = db['cache_winner_paso']
    cache_table.insert_many(results)


def caba_import_lists(fname):
    ''' import lists CSV '''
    t = db.create_table('listas_caba',
                        primary_id='id_lista',
                        primary_type='String(3)')
    f = open(fname, 'r')
    fields = f.readline().replace("\"", "").strip().split(',')
    c = csv.DictReader(f, fields)
    results = []
    for row in c:
        t_results = {}
        for k, v in row.iteritems():
            if k in SCHEMA_CABA_LISTS_NUMERIC.keys():
                kt = SCHEMA_CABA_LISTS_NUMERIC[k]
                t_results[kt] = int(v) if v else None
            if k not in SCHEMA_CABA_LISTS_NUMERIC.keys():
                t_results[k] = v.decode('utf-8')
        results.append(t_results)
    t.insert_many(results)


def caba_import_randomized_results(fname):
    ''' import caba results by polling table CSV '''
    t = db['resultados_caba']
    f = open(fname, 'r')
    fields = f.readline().replace("\"", "").strip().split(',')
    c = csv.DictReader(f, fields)
    results = []
    for row in c:
        t_results = {}
        for k, v in row.iteritems():
            if k in SCHEMA_RESULTS_NUMERIC.keys():
                kt = SCHEMA_RESULTS_NUMERIC[k]
                t_results[kt] = int(v) if v else None
            if k not in SCHEMA_RESULTS_NUMERIC.keys():
                t_results[k] = v.decode('utf-8')
            # Randomize votes
        votos = t_results["votos"]
        t_results["votos"] = randomized_int_by_perc(votos, 10)
        results.append(t_results)
    t.insert_many(results, chunk_size=50000)


def caba_results_by_poll_station_party():
    ''' aggregate results by polling station and
        political party'''
    tmp = []
    q = '''
        SELECT m.id_establecimiento, l.id_partido, SUM(r.votos) as votos
        FROM resultados_caba r, listas_caba l, mesas m
        WHERE r.nro_lista = l.nro_lista
        AND m.id_mesa = r.id_mesa
        GROUP BY m.id_establecimiento, l.id_partido;
        '''
    for p in db.query(q):
        p['votos'] = int(p['votos'])
        tmp.append(p)
    cache_table = db['votos_establecimiento_caba']
    cache_table.insert_many(tmp, chunk_size=1000)


def caba_classify_votes_by_poll_station():
    ''' classify votes by polling station '''
    tmp = []
    q = '''
        SELECT id_establecimiento,
            SUM(CASE WHEN id_partido = 'BLC'
                THEN votos else 0 end) as blancos,
            SUM(CASE WHEN id_partido not in ('NUL', 'REC', 'IMP', 'TEC')
                THEN votos else 0 end) as validos,
            SUM(CASE WHEN id_partido not in ('BLC', 'NUL', 'REC', 'IMP', 'TEC')
                THEN votos else 0 end) as positivos,
            SUM(CASE WHEN id_partido in ('NUL', 'REC', 'IMP', 'TEC')
                THEN votos else 0 end) as invalidos
            FROM votos_establecimiento_caba
            GROUP BY id_establecimiento
        '''

    for p in db.query(q):
        p['id_establecimiento'] = int(p['id_establecimiento'])
        p['blancos'] = int(p['blancos'])
        p['validos'] = int(p['validos'])
        p['positivos'] = int(p['positivos'])
        p['invalidos'] = int(p['invalidos'])
        tmp.append(p)
    votos_est = db['totales_establecimiento_caba']
    votos_est.insert_many(tmp)


def caba_winner_cache_table():
    q = '''
        WITH %(winner)s AS (SELECT id_establecimiento, id_partido, votos,
        row_number() over(partition by id_establecimiento
                          ORDER BY votos DESC) as rank,
        (votos - lead(votos,1,0) over(partition by id_establecimiento
                                     ORDER BY votos DESC)) as margin_victory
        FROM %(table_votes)s
        ORDER BY id_establecimiento, rank)
        SELECT e.id_establecimiento as id_establecimiento,
               e.id_comuna, e.geom,
               e.domicilio, e.descripcion,
               e.electores,
               t.positivos, sqrt(t.positivos) as sqrt_positivos,
               (t.validos + t.invalidos) as votantes,
               w.id_partido, w.votos, w.margin_victory
        FROM %(table_polling)s e, %(winner)s w, %(table_totals)s t
        WHERE e.id_establecimiento = w.id_establecimiento
        AND e.id_establecimiento = w.id_establecimiento
        AND e.id_establecimiento = t.id_establecimiento
        AND w.rank = 1;
        ''' % {'table_polling': 'establecimientos',
               'table_votes': 'votos_establecimiento_caba',
               'table_totals': 'totales_establecimiento_caba',
               'winner': 'winner'}

    results = db.query(q)
    cache_table = db['cache_winner_caba']
    cache_table.insert_many(results)


def caba_diff_table():
    '''get the difference for each polling station
       and party between primary and final elections'''

    q = '''
        SELECT vc.id_establecimiento, vc.id_partido,
        vc.votos, (vc.votos - vp.votos) as diferencia
        FROM votos_establecimiento_caba vc,
        votos_establecimiento_paso vp
        WHERE vc.id_establecimiento = vp.id_establecimiento
        and vc.id_partido = vp.id_partido
        and vc.id_partido NOT IN ('BLC','IMP','REC','NUL','TEC')
        '''

    results = db.query(q)
    cache_table = db['cache_diff_caba']
    cache_table.insert_many(results)


def caba_polling_with_totals_table():
    '''get the denormalized totals for each polling station'''

    q = '''
        SELECT e.*, tc.positivos, tc.validos, (tc.validos + tc.invalidos) as votantes
        FROM establecimientos e,
        totales_establecimiento_caba tc
        WHERE e.id_establecimiento = tc.id_establecimiento
        '''

    results = db.query(q)
    cache_table = db['establecimientos_totales_caba']
    cache_table.insert_many(results)


def process_results():
    print "clear DB"
    #clearDB()
    print "import common data"
    import_common_data()
    print "process PASO data"
    process_PASO()
    print "process CABA data"
    process_CABA()
    print "create cartodb cache tables"
    process_cartodb()


def import_common_data():
    print "import polling station data"
    import_poll_stations('%s/%s'
                         % (GEO_DATADICT_PATH, POLLING_STATIONS_DATA_FILE))

    print "import polling tables data"
    import_poll_tables('%s/%s'
                       % (PASO_DATADICT_PATH, POLLING_TABLES_DATA_FILE))


def process_PASO():
    print "import paso lists"
    paso_import_lists('%s/%s'
                      % (PASO_DATADICT_PATH, LISTS_DATA_FILE))

    print "import paso parties"
    paso_import_parties('%s/%s'
                        % (PASO_DATADICT_PATH, PARTIES_DATA_FILE))

    print "import paso results"
    paso_import_results('%s/%s'
                        % (PASO_RESULTS_PATH, RESULTS_DATA_FILE))

    print "aggregate paso results by polling station and party"
    paso_results_by_poll_station_party()

    print "classify paso votes by polling station"
    paso_classify_votes_by_poll_station()


def process_CABA():
    print "import caba lists"
    caba_import_lists('%s/%s'
                      % (CABA_DATADICT_PATH, LISTS_DATA_FILE))

    print "import caba results"
    caba_import_randomized_results('%s/%s'
                                   % (CABA_RESULTS_PATH, RESULTS_DATA_FILE))

    print "aggregate results by polling station and party"
    caba_results_by_poll_station_party()

    print "classify votes by polling station"
    caba_classify_votes_by_poll_station()


def process_cartodb():
    print "create CABA winner unnormalized table for cartodb performance"
    paso_winner_cache_table()

    print "create PASO winner unnormalized table for cartodb performance"
    caba_winner_cache_table()

    print "create PASO diff unnormalized table for cartodb performance"
    caba_diff_table()

    print "create polling stations with totals"
    caba_polling_with_totals_table()


if __name__ == "__main__":
    db = connect_dataset()
    process_results()
