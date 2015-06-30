# coding: utf-8
import dataset
import csv
import os
from default_settings import DB_RESULTS_URL

db = None
dir = os.path.dirname(__file__)
REL_POLLING_PATH = os.path.join(dir, '../data/maestras')
REL_RESULTS_PATH = os.path.join(dir, '../data/resultados')
POLLING_STATIONS_DATA_FILE = 'establecimientos.csv'
POLLING_TABLES_DATA_FILE = 'mesas_final.csv'
RESULTS_DATA_FILE = 'resultados_partido_lista.csv'
RELATIONS_DATA_FILE = 'relaciones.csv'


SCHEMA_POLLING_STATION_NUMERIC = {
    "caba_id": "id_caba",
    "distrito_id": "id_distrito",
    "seccion_id": "id_seccion",
    "mesa_desde": "mesa_desde",
    "mesa_hasta": "mesa_hasta",
    "num_mesas": "num_mesas"
}

SCHEMA_POLLING_TABLE_NUMERIC = {
    "id_mesa": "id_mesa",
    "id_establecimiento": "id_establecimiento_gob",
    "id_centro_de_distribucion": "id_centro",
    "ciudadanos_habilitados": "electores"
}

SCHEMA_RESULTS_NUMERIC = {
    "id_mesa": "id_mesa",
    "cantidad_votantes": "electores",
    "sobres_utilizados": "votantes",
    "JEF": "votos"
}

SCHEMA_RELATION_NUMERIC = {
    "id_establecimiento": "id_establecimiento",
    "id_agrupado": "id_agrupado"
}

SPECIAL_PARTIES = {
    "BLC": 0,
    "NUL": 1,
    "IMP": 1,
    "REC": 1,
    "TEC": 1
}


def connect_dataset():
    '''DB connection setup'''
    return dataset.connect(DB_RESULTS_URL)


def clearDB():
    ''' Clears the DB to make the script idempotent '''
    for t in db.tables:
        print t
        db.get_table(t).drop()


def import_poll_stations(fname):
    ''' import geolocated polling stations'''
    t = db['locales']
    f = open(fname, 'r')
    fields = f.readline().strip().split(',')
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
    t = db['mesas']
    f = open(fname, 'r')
    fields = f.readline().strip().split(',')
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


def import_results(fname):
    ''' import results by polling table CSV '''
    t = db['resultados']
    f = open(fname, 'r')
    fields = f.readline().strip().split(',')
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
    t.insert_many(results, chunk_size=10000)


def import_relations(fname):
    ''' import relations to fix polling stations CSV '''
    t = db['relaciones']
    f = open(fname, 'r')
    fields = f.readline().strip().split(',')
    c = csv.DictReader(f, fields)
    results = []
    for row in c:
        t_results = {}
        for k, v in row.iteritems():
            if k in SCHEMA_RELATION_NUMERIC.keys():
                kt = SCHEMA_RELATION_NUMERIC[k]
                t_results[kt] = int(v) if v else None
            if k not in SCHEMA_RELATION_NUMERIC.keys():
                t_results[k] = v.decode('utf-8')
        results.append(t_results)
    t.insert_many(results, chunk_size=10000)


def create_locales_tmp(table_polling='locales',
                       table_rel='relaciones'):
    '''create temp table'''
    q = '''
        SELECT l.*, r.id_agrupado
            FROM %s l, %s r
            WHERE l.id = r.id_establecimiento
        ''' % (table_polling,
               table_rel)
    results = db.query(q)
    locales_tmp_table = db['locales_tmp']
    locales_tmp_table.insert_many(results)


def create_locales_loc(table_polling='locales_tmp'):
    '''create polling stations by location'''
    q = '''
        SELECT t1.*
        FROM %s as t1
        LEFT OUTER JOIN %s as t2
        ON t1.id_agrupado = t2.id_agrupado
        AND t1.id > t2.id
        WHERE t2.id_agrupado IS NULL;
        ''' % (table_polling,
               table_polling)
    results = db.query(q)
    locales_loc_table = db['locales_loc']
    locales_loc_table.insert_many(results)


def aggregate_results_by_poll_station(table_polling='locales',
                                      table_votes='resultados'):
    ''' aggregate results by polling station
        political party'''
    tmp = []
    for r in db[table_polling]:
        q = '''
        SELECT id_partido, SUM(votos) as votos
            FROM "%s"
            WHERE id_mesa BETWEEN %d AND %d
            GROUP BY id_partido
        ''' % (table_votes,
               int(r['mesa_desde']),
               int(r['mesa_hasta']))

        for p in db.query(q):
            p['id_establecimiento'] = r['id']
            p['mesa_desde'] = r['mesa_desde']
            p['mesa_hasta'] = r['mesa_hasta']
            p['id_distrito'] = r['id_distrito']
            p['id_seccion'] = r['id_seccion']
            p['votos'] = int(p['votos'])
            tmp.append(p)

    votos_est = db['votos_establecimiento']
    votos_est.insert_many(tmp)


def aggregate_census_by_poll_station(table_polling='locales',
                                     table_census='mesas'):
    ''' aggregate census data by polling station '''
    tmp = []
    for r in db[table_polling]:
        q = '''
        SELECT id_establecimiento_gob, SUM(electores) as total
            FROM "%s"
            WHERE id_mesa BETWEEN %d AND %d
            GROUP BY id_establecimiento_gob
        ''' % (table_census,
               int(r['mesa_desde']),
               int(r['mesa_hasta']))

        for p in db.query(q):
            p['id_establecimiento'] = r['id']
            p['id_caba'] = r['id_caba']
            p['mesa_desde'] = r['mesa_desde']
            p['mesa_hasta'] = r['mesa_hasta']
            p['id_distrito'] = r['id_distrito']
            p['id_seccion'] = r['id_seccion']
            p['total'] = int(p['total'])
            tmp.append(p)

    votos_est = db['censo_establecimiento']
    votos_est.insert_many(tmp)


def aggregate_totals_by_poll_station(table_votes='votos_establecimiento'):
    ''' aggregate participation results by polling station '''
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
            FROM "%s"
            GROUP BY id_establecimiento
        ''' % (table_votes)

    for p in db.query(q):
        p['id_establecimiento'] = int(p['id_establecimiento'])
        p['blancos'] = int(p['blancos'])
        p['validos'] = int(p['validos'])
        p['positivos'] = int(p['positivos'])
        p['invalidos'] = int(p['invalidos'])
        tmp.append(p)
    votos_est = db['totales_establecimiento']
    votos_est.insert_many(tmp)


def aggregate_results_by_location(table_votes='votos_establecimiento',
                                table_rel='relaciones'):
    '''Aggregate by location to fix duplicates'''
    tmp = []
    q = '''
        SELECT a.id_agrupado, v.id_partido,
        sum(v.votos) as votos
        FROM %s as v, %s as a
        WHERE v.id_establecimiento = a.id_establecimiento
        GROUP BY a.id_agrupado, v.id_partido, v.id_distrito, v.id_seccion
        ''' % (table_votes, table_rel)

    for p in db.query(q):
        p['id_agrupado'] = int(p['id_agrupado'])
        p['votos'] = int(p['votos'])
        tmp.append(p)
    votos_loc = db['votos_loc']
    votos_loc.insert_many(tmp)


def aggregate_totals_by_location(table_totals='totales_establecimiento',
                                 table_rel='relaciones'):
    '''Aggregate by location to fix duplicates'''
    tmp = []
    q = '''
        SELECT a.id_agrupado, sum(t.blancos) as blancos,
        sum(t.validos) as validos, sum(t.invalidos) as invalidos,
        sum(t.positivos) as positivos
        FROM %s as t, %s as a
        WHERE t.id_establecimiento = a.id_establecimiento
        GROUP BY a.id_agrupado
        ''' % (table_totals, table_rel)

    for p in db.query(q):
        p['id_agrupado'] = int(p['id_agrupado'])
        p['blancos'] = int(p['blancos'])
        p['validos'] = int(p['validos'])
        p['invalidos'] = int(p['invalidos'])
        p['positivos'] = int(p['positivos'])
        tmp.append(p)
    totales_loc = db['totales_loc']
    totales_loc.insert_many(tmp)


def aggregate_census_by_location(table_census='censo_establecimiento',
                                 table_rel='relaciones'):
    '''Aggregate by location to fix duplicates'''
    tmp = []
    q = '''
        SELECT a.id_agrupado, sum(c.total) as total
        FROM %s as c, %s as a
        WHERE c.id_establecimiento = a.id_establecimiento
        GROUP BY a.id_agrupado
        ''' % (table_census, table_rel)

    for p in db.query(q):
        p['id_agrupado'] = int(p['id_agrupado'])
        p['total'] = int(p['total'])
        tmp.append(p)
    censo_loc = db['censo_loc']
    censo_loc.insert_many(tmp)


def make_cache_table(table_polling='locales',
                     table_votes='votos_establecimiento',
                     table_census='censo_establecimiento',
                     table_totals='totales_establecimiento'):
    q = '''
        WITH %(winner)s AS (SELECT id_establecimiento, id_partido, votos,
        row_number() over(partition by id_establecimiento
                          ORDER BY votos DESC) as rank,
        (votos - lead(votos,1,0) over(partition by id_establecimiento
                                     ORDER BY votos DESC)) as margin_victory
        FROM %(table_votes)s
        ORDER BY id_establecimiento, rank)
        SELECT c.id_establecimiento_gob as id_establecimiento_gob,
               l.id as id_establecimiento,
               l.id_distrito, l.id_seccion,
               l.mesa_desde, l.mesa_hasta, l.num_mesas, l.geom,
               l.circuito, l.direccion, l.nombre,
               c.total as electores,
               t.positivos, sqrt(t.positivos) as sqrt_positivos,
               (t.validos + t.invalidos) as votantes,
               w.id_partido, w.votos, w.margin_victory
        FROM %(table_polling)s l
        INNER JOIN %(winner)s w ON l.id = w.id_establecimiento
        INNER JOIN %(table_census)s c ON l.id = c.id_establecimiento
        INNER JOIN %(table_totals)s t ON l.id = t.id_establecimiento
        AND w.rank = 1;
        ''' % {'table_polling': table_polling,
               'table_votes': table_votes,
               'table_census': table_census,
               'table_totals': table_totals,
               'winner': 'winner'}

    results = db.query(q)
    cache_table = db['cache_votos_paso_2015']
    cache_table.insert_many(results)

def make_cache_table_loc(table_polling='locales_loc',
                     table_votes='votos_loc',
                     table_census='censo_loc',
                     table_totals='totales_loc'):
    q = '''
        WITH %(winner)s AS (SELECT id_agrupado, id_partido, votos,
        row_number() over(partition by id_agrupado
                          ORDER BY votos DESC) as rank,
        (votos - lead(votos,1,0) over(partition by id_agrupado
                                     ORDER BY votos DESC)) as margin_victory
        FROM %(table_votes)s
        ORDER BY id_agrupado, rank)
        SELECT l.id_agrupado as id_establecimiento,
               l.id_distrito, l.id_seccion,
               l.direccion, l.nombre, l.geom,
               c.total as electores,
               t.positivos, sqrt(t.positivos) as sqrt_positivos,
               (t.validos + t.invalidos) as votantes,
               w.id_partido, w.votos, w.margin_victory
        FROM %(table_polling)s l
        INNER JOIN %(winner)s w ON l.id_agrupado = w.id_agrupado
        INNER JOIN %(table_census)s c ON l.id_agrupado = c.id_agrupado
        INNER JOIN %(table_totals)s t ON l.id_agrupado = t.id_agrupado
        AND w.rank = 1;
        ''' % {'table_polling': table_polling,
               'table_votes': table_votes,
               'table_census': table_census,
               'table_totals': table_totals,
               'winner': 'winner'}

    results = db.query(q)
    cache_table = db['cache_votos_paso_2015_loc']
    cache_table.insert_many(results)


def process_CABA():
    print "clear DB"
    clearDB()
    print "import polling station data"
    import_poll_stations('%s/%s'
                         % (REL_POLLING_PATH, POLLING_STATIONS_DATA_FILE))

    print "import polling tables data"
    import_poll_tables('%s/%s'
                       % (REL_POLLING_PATH, POLLING_TABLES_DATA_FILE))

    print "import results"
    import_results('%s/%s'
                   % (REL_RESULTS_PATH, RESULTS_DATA_FILE))

    print "import relations"
    import_relations('%s/%s'
                     % (REL_POLLING_PATH, RELATIONS_DATA_FILE))

    print "create polling stations tmp"
    create_locales_tmp()

    print "create polling stations assigned to location"
    create_locales_loc()

    print "aggregate census data by polling station"
    aggregate_census_by_poll_station()

    print "aggregate results by polling station and party"
    aggregate_results_by_poll_station()

    print "aggregate totals by polling station"
    aggregate_totals_by_poll_station()

    print "aggregate census data by location"
    aggregate_census_by_location()

    print "aggregate results by location"
    aggregate_results_by_location()

    print "aggregate totals by location"
    aggregate_totals_by_location()

    print "create unnormalized table for cartodb performance"
    make_cache_table()

    print "create unnormalized table for cartodb performance by location"
    make_cache_table_loc()


if __name__ == "__main__":
    db = connect_dataset()
    process_CABA()
