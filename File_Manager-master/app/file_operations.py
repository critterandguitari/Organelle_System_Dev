import json
import os
from os import walk, path
import shutil
import cherrypy

BASE_DIR = "/usbdrive"

#TODO don't return ok if error what the hell
def download(path):
    path = BASE_DIR + path
    dl = open(path, 'r').read()
    cherrypy.response.headers['Content-Type'] = "application/octet-stream"
    cherrypy.response.headers['Content-Disposition'] = "attachment"
    return dl

def rename(old, new):
    src = BASE_DIR + old 
    dst = path.dirname(src) + '/' + new
    #cherrypy.log("about to rename " + src + " to " + dst)
    os.rename(src, dst)
    return '{"ok":"ok"}'

def create(dst, name):
    location = BASE_DIR + dst 
    os.mkdir(location + '/' + name)
    return '{"ok":"ok"}'

def move(src, dst):
    src = BASE_DIR + src
    dst = BASE_DIR + dst 
    shutil.move(src, dst)
    return '{"ok":"ok"}'

def unzip(zip_path):
    zip_path = BASE_DIR + zip_path
    zip_parent_folder = path.dirname(zip_path)
    os.system("unzip -o \""+zip_path+"\" -d \""+zip_parent_folder+"\" -x '__MACOSX/*'")
    return '{"ok":"ok"}'

def zip(folder):
    folder = BASE_DIR + folder
    if os.path.isdir(folder) :
        os.system("cd \""+path.dirname(folder)+"\" && zip -r \""+path.basename(folder)+".zip\" \""+path.basename(folder)+"\"")
    return '{"ok":"ok"}'

def copy(src, dst):
    src = BASE_DIR + src
    dst = BASE_DIR + dst 
    dstfinal = dst + '/' + path.basename(src)
    if os.path.isfile(src) :
        shutil.copy(src, dst)
    if os.path.isdir(src) :
        shutil.copytree(src, dstfinal)
    return '{"ok":"ok"}'

def delete(src):
    src = BASE_DIR + src 
    if os.path.isfile(src) :
        os.remove(src)
    if os.path.isdir(src) :
        shutil.rmtree(src)
    return '{"ok":"ok"}'

def get_node(fpath):
    if fpath == '#' :
        return get_files(BASE_DIR)
    else :
        fpath = fpath
        return get_files(BASE_DIR + fpath)

def file_to_dict(fpath):
    fpath = fpath
    return {
        'text': path.basename(fpath),
        'children': False,
        'type': 'file',
        'id': fpath.split(BASE_DIR,1)[1],
        }

def folder_to_dict(fpath):
    fpath = fpath
    return {
        'text': path.basename(fpath),
        'children': True,
        'type': 'folder',
        'id': fpath.split(BASE_DIR,1)[1],
        }

def get_files(rootpath):
    root, folders, files = walk(rootpath).next()
    #contents = {}
    #contents['parent'] = rootpath.replace('/usbdrive/Patches/','')
    contents = []
    contents  = [file_to_dict(path.sep.join([root, fpath])) for fpath in files if not fpath[0] == '.'] 
    contents += [folder_to_dict(path.sep.join([root, fpath])) for fpath in folders if not fpath[0] == '.'] 
    return json.dumps(contents, indent=4, encoding='utf-8')


