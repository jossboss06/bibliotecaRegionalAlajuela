CREATE USER biblioteca IDENTIFIED BY biblioteca123;

GRANT CONNECT, RESOURCE TO biblioteca;
GRANT CREATE SESSION, CREATE TABLE, CREATE VIEW, CREATE SEQUENCE, CREATE TRIGGER TO biblioteca;

-- === Tablas Base === --
CREATE TABLE autor (
  id_autor NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR2(40) NOT NULL,
  apellido VARCHAR2(40) NOT NULL,
  pseudonimo VARCHAR2(60)
);

CREATE TABLE categoria (
  id_categoria NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR2(50) NOT NULL UNIQUE
);

CREATE TABLE libro (
  id_libro NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  titulo VARCHAR2(150) NOT NULL,
  id_autor NUMBER NOT NULL,
  id_categoria NUMBER,
  anio_publicacion NUMBER,
  isbn VARCHAR2(20) UNIQUE,
  cantidad_total NUMBER CHECK (cantidad_total >= 0),
  cantidad_disponible NUMBER CHECK (cantidad_disponible >= 0),
  FOREIGN KEY (id_autor) REFERENCES autor(id_autor),
  FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria)
);

CREATE TABLE usuario (
  id_usuario NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR2(50),
  apellidos VARCHAR2(80),
  correo VARCHAR2(100) UNIQUE,
  telefono VARCHAR2(20),
  estado VARCHAR2(15) DEFAULT 'ACTIVO'
);

CREATE TABLE empleado (
  id_empleado NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR2(50),
  apellido VARCHAR2(50),
  usuario VARCHAR2(50) UNIQUE,
  contrasena VARCHAR2(100)
);

CREATE TABLE prestamo (
  id_prestamo NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_usuario NUMBER,
  id_empleado NUMBER,
  fecha_prestamo DATE DEFAULT SYSDATE,
  fecha_limite DATE,
  estado VARCHAR2(15) DEFAULT 'ACTIVO',
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
  FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado)
);

CREATE TABLE detalle_prestamo (
  id_detalle NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_prestamo NUMBER,
  id_libro NUMBER,
  cantidad NUMBER DEFAULT 1,
  FOREIGN KEY (id_prestamo) REFERENCES prestamo(id_prestamo),
  FOREIGN KEY (id_libro) REFERENCES libro(id_libro)
);

CREATE TABLE devolucion (
  id_devolucion NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_detalle NUMBER UNIQUE,
  fecha_devolucion DATE DEFAULT SYSDATE,
  observacion VARCHAR2(200),
  FOREIGN KEY (id_detalle) REFERENCES detalle_prestamo(id_detalle)
);

CREATE TABLE multa (
  id_multa NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_detalle NUMBER,
  monto NUMBER(10,2),
  pagada NUMBER(1) DEFAULT 0,
  FOREIGN KEY (id_detalle) REFERENCES detalle_prestamo(id_detalle)
);

CREATE TABLE pago_multa (
  id_pago NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_multa NUMBER,
  fecha_pago DATE DEFAULT SYSDATE,
  monto_pagado NUMBER(10,2),
  metodo_pago VARCHAR2(20),
  FOREIGN KEY (id_multa) REFERENCES multa(id_multa)
);

-- === Triggers === --

-- TRIGGERS DE STOCK

CREATE OR REPLACE TRIGGER trg_restar_stock
AFTER INSERT ON detalle_prestamo
FOR EACH ROW
BEGIN
  UPDATE libro
  SET cantidad_disponible = cantidad_disponible - :NEW.cantidad
  WHERE id_libro = :NEW.id_libro;
END;
/

CREATE OR REPLACE TRIGGER trg_devolver_stock
AFTER INSERT ON devolucion
FOR EACH ROW
DECLARE
  v_id_libro NUMBER;
BEGIN
  SELECT id_libro INTO v_id_libro
  FROM detalle_prestamo
  WHERE id_detalle = :NEW.id_detalle;

  UPDATE libro
  SET cantidad_disponible = cantidad_disponible + 1
  WHERE id_libro = v_id_libro;
END;
/

-- MULTAS

CREATE OR REPLACE TRIGGER trg_pago_multa
AFTER INSERT ON pago_multa
FOR EACH ROW
BEGIN
  UPDATE multa SET pagada = 1
  WHERE id_multa = :NEW.id_multa;
END;
/

-- USUARIO

CREATE OR REPLACE TRIGGER trg_correo_minuscula
BEFORE INSERT ON usuario
FOR EACH ROW
BEGIN
  :NEW.correo := LOWER(:NEW.correo);
END;
/

-- LIBRO

CREATE OR REPLACE TRIGGER trg_evitar_borrado_libro
BEFORE DELETE ON libro
FOR EACH ROW
BEGIN
  IF :OLD.cantidad_total > 0 THEN
    RAISE_APPLICATION_ERROR(-20001, 'No se puede eliminar libro con stock');
  END IF;
END;
/

-- === Triggers === --

-- de Libro
CREATE OR REPLACE TRIGGER trg_libro_evitar_eliminacion
BEFORE DELETE ON libro
FOR EACH ROW
BEGIN
  IF :OLD.cantidad_total > 0 THEN
    RAISE_APPLICATION_ERROR(-20001, 'No se puede eliminar un libro con stock registrado.');
  END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_libro_auditoria
AFTER UPDATE ON libro
FOR EACH ROW
BEGIN
  DBMS_OUTPUT.PUT_LINE(
    'Libro actualizado ID: ' || :OLD.id_libro ||
    ' | Stock anterior: ' || :OLD.cantidad_disponible ||
    ' | Nuevo stock: ' || :NEW.cantidad_disponible
  );
END;
/

--de usuario

CREATE OR REPLACE TRIGGER trg_usuario_correo_minuscula
BEFORE INSERT ON usuario
FOR EACH ROW
BEGIN
  :NEW.correo := LOWER(:NEW.correo);
END;
/

CREATE OR REPLACE TRIGGER trg_usuario_auditoria_estado
BEFORE UPDATE OF estado ON usuario
FOR EACH ROW
BEGIN
  DBMS_OUTPUT.PUT_LINE(
    'Usuario ' || :OLD.nombre ||
    ' cambia de ' || :OLD.estado ||
    ' a ' || :NEW.estado
  );
END;
/

--de detalle_prestamo

CREATE OR REPLACE TRIGGER trg_detalle_restar_stock
AFTER INSERT ON detalle_prestamo
FOR EACH ROW
BEGIN
  UPDATE libro
  SET cantidad_disponible = cantidad_disponible - :NEW.cantidad
  WHERE id_libro = :NEW.id_libro;
END;
/

CREATE OR REPLACE TRIGGER trg_detalle_devolver_stock
AFTER DELETE ON detalle_prestamo
FOR EACH ROW
BEGIN
  UPDATE libro
  SET cantidad_disponible = cantidad_disponible + :OLD.cantidad
  WHERE id_libro = :OLD.id_libro;
END;
/

--de prestamo

CREATE OR REPLACE TRIGGER trg_prestamo_atraso
BEFORE UPDATE OF estado ON prestamo
FOR EACH ROW
BEGIN
  IF :NEW.estado = 'ATRASADO' THEN
    DBMS_OUTPUT.PUT_LINE('Préstamo ID ' || :OLD.id_prestamo || ' marcado como atrasado.');
  END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_prestamo_validar_fecha
BEFORE INSERT ON prestamo
FOR EACH ROW
BEGIN
  IF :NEW.fecha_limite < SYSDATE THEN
    RAISE_APPLICATION_ERROR(-20002, 'La fecha límite no puede ser menor a hoy.');
  END IF;
END;
/

--de devolucion

CREATE OR REPLACE TRIGGER trg_devolucion_sumar_stock
AFTER INSERT ON devolucion
FOR EACH ROW
DECLARE
  v_id_libro NUMBER;
BEGIN
  SELECT id_libro INTO v_id_libro
  FROM detalle_prestamo
  WHERE id_detalle = :NEW.id_detalle;

  UPDATE libro
  SET cantidad_disponible = cantidad_disponible + 1
  WHERE id_libro = v_id_libro;
END;
/

CREATE OR REPLACE TRIGGER trg_devolucion_cerrar_prestamo
AFTER INSERT ON devolucion
FOR EACH ROW
DECLARE
  v_id_prestamo NUMBER;
BEGIN
  SELECT id_prestamo INTO v_id_prestamo
  FROM detalle_prestamo
  WHERE id_detalle = :NEW.id_detalle;

  UPDATE prestamo
  SET estado = 'DEVUELTO'
  WHERE id_prestamo = v_id_prestamo;
END;
/

--de multa

CREATE OR REPLACE TRIGGER trg_multa_generar_log
BEFORE INSERT ON multa
FOR EACH ROW
BEGIN
  DBMS_OUTPUT.PUT_LINE('Se genera multa por monto: ' || :NEW.monto);
END;
/

CREATE OR REPLACE TRIGGER trg_multa_evitar_negativos
BEFORE INSERT OR UPDATE ON multa
FOR EACH ROW
BEGIN
  IF :NEW.monto < 0 THEN
    RAISE_APPLICATION_ERROR(-20003, 'La multa no puede ser negativa.');
  END IF;
END;
/

--de pago_multa

CREATE OR REPLACE TRIGGER trg_pago_multa_actualizar_estado
AFTER INSERT ON pago_multa
FOR EACH ROW
BEGIN
  UPDATE multa
  SET pagada = 1
  WHERE id_multa = :NEW.id_multa;
END;
/

CREATE OR REPLACE TRIGGER trg_pago_multa_bloquear_edicion
BEFORE UPDATE OR DELETE ON pago_multa
FOR EACH ROW
BEGIN
  RAISE_APPLICATION_ERROR(-20004, 'No se permite modificar ni eliminar pagos.');
END;
/

-- === Inserts de ejemplo === --

-- === Procedures === --

-- Libros por categoria

CREATE OR REPLACE PROCEDURE sp_libros_categoria(p_cat VARCHAR2)
AS
CURSOR c IS
SELECT titulo FROM libro l
JOIN categoria c ON l.id_categoria = c.id_categoria
WHERE UPPER(c.nombre) = UPPER(p_cat);
BEGIN
  FOR r IN c LOOP
    DBMS_OUTPUT.PUT_LINE(r.titulo);
  END LOOP;
END;
/

-- Prestamos atrasados

CREATE OR REPLACE PROCEDURE sp_atrasos
AS
CURSOR c IS
SELECT id_prestamo FROM prestamo
WHERE fecha_limite < SYSDATE AND estado='ACTIVO';
BEGIN
  FOR r IN c LOOP
    UPDATE prestamo SET estado='ATRASADO'
    WHERE id_prestamo = r.id_prestamo;
  END LOOP;
END;
/

-- Multas automaticas

CREATE OR REPLACE PROCEDURE sp_multas
AS
CURSOR c IS
SELECT d.id_detalle,
       (SYSDATE - p.fecha_limite) dias
FROM devolucion d
JOIN detalle_prestamo dp ON d.id_detalle = dp.id_detalle
JOIN prestamo p ON dp.id_prestamo = p.id_prestamo;

BEGIN
  FOR r IN c LOOP
    INSERT INTO multa(id_detalle, monto, pagada)
    VALUES(r.id_detalle, r.dias*500, 0);
  END LOOP;
END;
/

-- Usuaios morosos

CREATE OR REPLACE PROCEDURE sp_suspender_usuarios
AS
CURSOR c IS
SELECT u.id_usuario
FROM usuario u
JOIN prestamo p ON u.id_usuario=p.id_usuario
JOIN detalle_prestamo d ON p.id_prestamo=d.id_prestamo
JOIN multa m ON d.id_detalle=m.id_detalle
WHERE m.pagada=0
GROUP BY u.id_usuario
HAVING COUNT(*)>=3;

BEGIN
  FOR r IN c LOOP
    UPDATE usuario SET estado='SUSPENDIDO'
    WHERE id_usuario=r.id_usuario;
  END LOOP;
END;
/

-- CRUD COMPLETO (procedimentos)

-- Para usuarios

CREATE OR REPLACE PROCEDURE sp_insert_usuario(p_nombre VARCHAR2,p_ap VARCHAR2,p_correo VARCHAR2,p_tel VARCHAR2)
AS BEGIN
INSERT INTO usuario VALUES(NULL,p_nombre,p_ap,p_correo,p_tel,'ACTIVO');
END;
/

CREATE OR REPLACE PROCEDURE sp_update_usuario(p_id NUMBER,p_nombre VARCHAR2,p_ap VARCHAR2)
AS BEGIN
UPDATE usuario SET nombre=p_nombre, apellidos=p_ap WHERE id_usuario=p_id;
END;
/

CREATE OR REPLACE PROCEDURE sp_delete_usuario(p_id NUMBER)
AS BEGIN
DELETE FROM usuario WHERE id_usuario=p_id;
END;
/

-- Para Autor

CREATE OR REPLACE PROCEDURE sp_insert_autor (
    p_nombre VARCHAR2,
    p_apellido VARCHAR2,
    p_pseudonimo VARCHAR2
) AS
BEGIN
    INSERT INTO autor (nombre, apellido, pseudonimo)
    VALUES (p_nombre, p_apellido, p_pseudonimo);
END;
/

CREATE OR REPLACE PROCEDURE sp_update_autor (
    p_id NUMBER,
    p_nombre VARCHAR2,
    p_apellido VARCHAR2,
    p_pseudonimo VARCHAR2
) AS
BEGIN
    UPDATE autor
    SET nombre = p_nombre,
        apellido = p_apellido,
        pseudonimo = p_pseudonimo
    WHERE id_autor = p_id;
END;
/

CREATE OR REPLACE PROCEDURE sp_delete_autor (
    p_id NUMBER
) AS
BEGIN
    DELETE FROM autor WHERE id_autor = p_id;
END;
/

-- Para categoria

CREATE OR REPLACE PROCEDURE sp_insert_categoria (
    p_nombre VARCHAR2
) AS
BEGIN
    INSERT INTO categoria (nombre)
    VALUES (UPPER(p_nombre));
END;
/

CREATE OR REPLACE PROCEDURE sp_update_categoria (
    p_id NUMBER,
    p_nombre VARCHAR2
) AS
BEGIN
    UPDATE categoria
    SET nombre = UPPER(p_nombre)
    WHERE id_categoria = p_id;
END;
/

CREATE OR REPLACE PROCEDURE sp_delete_categoria (
    p_id NUMBER
) AS
BEGIN
    DELETE FROM categoria WHERE id_categoria = p_id;
END;
/

-- Para Libros

CREATE OR REPLACE PROCEDURE sp_insert_libro (
    p_titulo VARCHAR2,
    p_id_autor NUMBER,
    p_id_categoria NUMBER,
    p_anio NUMBER,
    p_isbn VARCHAR2,
    p_total NUMBER
) AS
BEGIN
    INSERT INTO libro (
        titulo, id_autor, id_categoria,
        anio_publicacion, isbn,
        cantidad_total, cantidad_disponible
    )
    VALUES (
        p_titulo, p_id_autor, p_id_categoria,
        p_anio, p_isbn,
        p_total, p_total
    );
END;
/

CREATE OR REPLACE PROCEDURE sp_update_libro (
    p_id NUMBER,
    p_titulo VARCHAR2,
    p_stock NUMBER
) AS
BEGIN
    UPDATE libro
    SET titulo = p_titulo,
        cantidad_disponible = p_stock
    WHERE id_libro = p_id;
END;
/

CREATE OR REPLACE PROCEDURE sp_delete_libro (
    p_id NUMBER
) AS
BEGIN
    DELETE FROM libro WHERE id_libro = p_id;
END;
/

-- Para empleados

CREATE OR REPLACE PROCEDURE sp_insert_empleado (
    p_nombre VARCHAR2,
    p_apellido VARCHAR2,
    p_usuario VARCHAR2,
    p_contrasena VARCHAR2
) AS
BEGIN
    INSERT INTO empleado (nombre, apellido, usuario, contrasena)
    VALUES (p_nombre, p_apellido, p_usuario, p_contrasena);
END;
/

CREATE OR REPLACE PROCEDURE sp_update_empleado (
    p_id NUMBER,
    p_nombre VARCHAR2,
    p_apellido VARCHAR2,
    p_usuario VARCHAR2
) AS
BEGIN
    UPDATE empleado
    SET nombre = p_nombre,
        apellido = p_apellido,
        usuario = p_usuario
    WHERE id_empleado = p_id;
END;
/

CREATE OR REPLACE PROCEDURE sp_delete_empleado (
    p_id NUMBER
) AS
BEGIN
    DELETE FROM empleado WHERE id_empleado = p_id;
END;
/

-- Para prestamos

CREATE OR REPLACE PROCEDURE sp_insert_prestamo (
    p_usuario NUMBER,
    p_empleado NUMBER,
    p_fecha_limite DATE
) AS
BEGIN
    INSERT INTO prestamo (id_usuario, id_empleado, fecha_limite, estado)
    VALUES (p_usuario, p_empleado, p_fecha_limite, 'ACTIVO');
END;
/

CREATE OR REPLACE PROCEDURE sp_update_prestamo (
    p_id NUMBER,
    p_estado VARCHAR2
) AS
BEGIN
    UPDATE prestamo
    SET estado = p_estado
    WHERE id_prestamo = p_id;
END;
/

CREATE OR REPLACE PROCEDURE sp_delete_prestamo (
    p_id NUMBER
) AS
BEGIN
    DELETE FROM prestamo WHERE id_prestamo = p_id;
END;
/

-- Para devoluciones

CREATE OR REPLACE PROCEDURE sp_insert_devolucion (
    p_detalle NUMBER,
    p_obs VARCHAR2
) AS
BEGIN
    INSERT INTO devolucion (id_detalle, observacion)
    VALUES (p_detalle, p_obs);
END;
/

CREATE OR REPLACE PROCEDURE sp_update_devolucion (
    p_id NUMBER,
    p_obs VARCHAR2
) AS
BEGIN
    UPDATE devolucion
    SET observacion = p_obs
    WHERE id_devolucion = p_id;
END;
/

CREATE OR REPLACE PROCEDURE sp_delete_devolucion (
    p_id NUMBER
) AS
BEGIN
    DELETE FROM devolucion WHERE id_devolucion = p_id;
END;
/

-- Para multas

CREATE OR REPLACE PROCEDURE sp_insert_multa (
    p_detalle NUMBER,
    p_monto NUMBER
) AS
BEGIN
    INSERT INTO multa (id_detalle, monto, pagada)
    VALUES (p_detalle, p_monto, 0);
END;
/

CREATE OR REPLACE PROCEDURE sp_update_multa (
    p_id NUMBER,
    p_monto NUMBER,
    p_pagada NUMBER
) AS
BEGIN
    UPDATE multa
    SET monto = p_monto,
        pagada = p_pagada
    WHERE id_multa = p_id;
END;
/

CREATE OR REPLACE PROCEDURE sp_delete_multa (
    p_id NUMBER
) AS
BEGIN
    DELETE FROM multa WHERE id_multa = p_id;
END;
/

-- === Vistas con expresiones regulares === -

-- Consulta de prestamos por cada usuario
CREATE OR REPLACE VIEW prestamos_por_usuario_vista AS
SELECT 
    u.id_usuario,
    u.nombre || ' ' || u.apellidos AS nombre_completo,
    u.correo,
    u.estado,
    COUNT(p.id_prestamo) AS total_prestamos
FROM usuario u
LEFT JOIN prestamo p ON u.id_usuario = p.id_usuario
WHERE REGEXP_LIKE(u.correo, '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') -- revisa que el correo sea correcto y en formato valido
GROUP BY u.id_usuario, u.nombre, u.apellidos, u.correo, u.estado;

-- Consulta de prestamos por cada libro
CREATE OR REPLACE VIEW prestamos_por_libro_vista AS
SELECT 
    l.id_libro,
    l.titulo,
    a.nombre || ' ' || a.apellido AS autor,
    c.nombre AS categoria,
    COUNT(dp.id_detalle) AS veces_prestado,
    l.cantidad_total,
    l.cantidad_disponible,
    
    -- limpieza de ISBN usando REGEX
    REGEXP_REPLACE(l.isbn, '[^0-9A-Za-z]', '') AS isbn_limpio

FROM libro l
JOIN autor a ON l.id_autor = a.id_autor
LEFT JOIN categoria c ON l.id_categoria = c.id_categoria
LEFT JOIN detalle_prestamo dp ON l.id_libro = dp.id_libro
GROUP BY 
    l.id_libro, l.titulo, a.nombre, a.apellido, c.nombre,
    l.cantidad_total, l.cantidad_disponible, l.isbn;
    
-- Consulta los libros que no se han devuelto aun  
CREATE OR REPLACE VIEW libros_no_devueltos_vista AS
SELECT 
    p.id_prestamo,

    -- Extrae solo el numero de usuario desde texto combinado
    REGEXP_SUBSTR(u.nombre || ' ' || u.apellidos, '[A-Za-z]+') AS nombre_usuario,

    u.correo,
    l.titulo AS libro,
    p.fecha_prestamo,
    p.fecha_limite,
    p.estado AS estado_prestamo,
    TRUNC(SYSDATE - p.fecha_limite) AS dias_desde_limite

FROM prestamo p
JOIN usuario u ON p.id_usuario = u.id_usuario
JOIN detalle_prestamo dp ON p.id_prestamo = dp.id_prestamo
JOIN libro l ON dp.id_libro = l.id_libro
WHERE p.estado IN ('ACTIVO', 'ATRASADO');
    
-- Consuulta las multas pendientes.    
CREATE OR REPLACE VIEW multas_pendientes_vista AS
SELECT 
    u.id_usuario,
    u.nombre || ' ' || u.apellidos AS usuario,
    u.estado,
    l.titulo AS libro,
    m.id_multa,
    m.monto,
    p.fecha_limite,
    dev.fecha_devolucion

FROM multa m
JOIN detalle_prestamo dp ON m.id_detalle = dp.id_detalle
JOIN prestamo p ON dp.id_prestamo = p.id_prestamo
JOIN usuario u ON p.id_usuario = u.id_usuario
JOIN libro l ON dp.id_libro = l.id_libro
LEFT JOIN devolucion dev ON dp.id_detalle = dev.id_detalle

WHERE m.pagada = 0
  AND REGEXP_LIKE(u.correo, '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

COMMIT