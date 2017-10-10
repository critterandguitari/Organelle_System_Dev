import os.path
current_dir = os.path.dirname(os.path.abspath(__file__))
import time
import glob
import json
import cherrypy
import urllib
import time
import socket
import file_operations

from cherrypy.lib import static

def get_immediate_subdirectories(dir) :
    return [name for name in os.listdir(dir)
            if os.path.isdir(os.path.join(dir, name))]


class Root():

    def tester(self, name):
        return "TESTdf"
        print "cool"
    tester.exposed = True

    def getfile(self, fpath, cb):
        cherrypy.response.headers['Cache-Control'] = "no-cache, no-store, must-revalidate"
        cherrypy.response.headers['Pragma'] = "no-cache"
        cherrypy.response.headers['Expires'] = "0"
        src = file_operations.BASE_DIR + fpath
        return static.serve_file(src)
    getfile.exposed = True

    def getdl(self, fpath, cb):
        src = file_operations.BASE_DIR + fpath
        dl = open(src, 'r').read()
        fname = os.path.basename(fpath)
        cherrypy.response.headers['content-type']        = 'application/octet-stream'
        cherrypy.response.headers['content-disposition'] = 'attachment; filename={}'.format(fname)
        return dl
    getdl.exposed = True

    def upload(self, nid, **fdata):
        upload = fdata['files[]']
        folder = nid
        filename = upload.filename
        size = 0
        with open(file_operations.BASE_DIR + folder + '/' + filename, 'wb') as newfile:
            while True:
                data = upload.file.read(8192)
                if not data:
                    break
                size += len(data)
                newfile.write(data)
        cherrypy.response.headers['Content-Type'] = "application/json"
        return '{"files":[{"name":"x","size":1,"url":"na","thumbnailUrl":"na","deleteUrl":"na","deleteType":"DELETE"}]}'
        
    upload.exposed = True
  
    def fmdata(self, **data):
        
        ret = ''
        if 'operation' in data :
            cherrypy.response.headers['Content-Type'] = "application/json"
            if data['operation'] == 'get_node' :
                return file_operations.get_node(data['id'])
            if data['operation'] == 'create_node' :
                return file_operations.create(data['id'], data['text'])
            if data['operation'] == 'rename_node' :
                return file_operations.rename(data['id'], data['text'])
            if data['operation'] == 'delete_node' :
                return file_operations.delete(data['id'])
            if data['operation'] == 'move_node' :
                return file_operations.move(data['id'], data['parent'])
            if data['operation'] == 'copy_node' :
                return file_operations.copy(data['id'], data['parent'])
            if data['operation'] == 'unzip_node' :
                return file_operations.unzip(data['id'])
            if data['operation'] == 'download_node' :
                return file_operations.download(data['id'])
            if data['operation'] == 'zip_node' :
                return file_operations.zip(data['id'])
              
        else :
            cherrypy.response.headers['Content-Type'] = "application/json"
            return "no operation specified"

    fmdata.exposed = True
   
    # returns list of all the modees
    def index(self):
        raise cherrypy.HTTPRedirect("/files")

    index.exposed = True


