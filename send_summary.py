import sys

import pymongo
from distutils import version

from operator import itemgetter, attrgetter

from settings import usagedb as db, email

def genBody():

    body = "Monthly (last month partial)\n"
    body += "Month\t  Total\tUnique\n";
    for x in db["gen.monthly"].find().sort( "_id" , pymongo.DESCENDING ):
        body += "%s\t  %d\t%d\n" % ( x["_id"] , int(x["value"]["total"]) , int(x["value"]["unique"] ) )

    body += "\n\n"
    body += "Weekly (last week partial)\n"
    body += "Week    \tTotal\tUnique\n";
    for x in db["gen.weekly"].find().sort( "_id" , pymongo.DESCENDING ):
        body += "%s\t%d\t%d\n" % ( x["_id"] , int(x["value"]["total"]) , int(x["value"]["unique"] ) )

    body += "\n\n"
    body += "OS version last week\n"
    for x in db["gen.firstPiece.day7"].find().sort( "value" , pymongo.DESCENDING ):
        bad = False 
        for j in [ "." , "-" , "log" , "stats" ]:
            if x["_id"].find( j ) >= 0:
                bad = True
                break
        if bad:
            continue
        body += "%s\t%d\n" % ( x["_id"] , x["value"] )

    body += "\n\n"
    body += "Versions\n"

    versions = []
    for x in db["gen.versions"].find().sort( "_id" , pymongo.DESCENDING ):
        x["v"] = version.LooseVersion( x["_id"] )
        versions.append( x )

    versions.sort( key=lambda x: x["v"] )
    versions.reverse()

    for x in versions:
        body += "%-8s\t%d\t%s\n" % ( x["_id"] , 
                                     int(x["value"]["count"]) , 
                                     str(x["value"]["minDate"]).partition( " " )[0] )

    return body

def sendEmail():
    to = ["everyone@10gen.com", "board@10gen.com"]
    body = genBody()
    subject = "MongoDB Download Usage"
    email.get_client().send_email("info@10gen.com", subject, body, to)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        print( genBody() )
    else:
        sendEmail()
